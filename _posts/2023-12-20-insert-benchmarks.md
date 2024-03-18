---
layout: post
title: "Building a weather data warehouse part I: Benchmarking loading 80 years of global weather data into PostgreSQL and TimescaleDB as fast as possible"
toc: true
---

# What are we even doing?

## Why build a weather data warehouse?

We have _tons_ of weather data we can analyze to look for signals of climate change. In particular, I'm interested in figuring out how much climate change we've _already_ had. This questions is maybe best answered by looking at historical weather data.

It's pretty common to look at climate model projections and think about future climate change, but there are plenty of anecdotes about how the weather isn't what it used to be.

We might want to look at localized temporal statistics: how much warmer is Dallas these days compared to previous decades? Is Dallas getting drier or wetter? Does it receive fewer but more intense storms?
We might want to look at geospatial-temporal statistics: how much warmer is Chile? Are all parts of Chile warming or are there regions that are cooling? Is it getting cloudier in the Japanese province of Sapporo?

It would be cool if we could query a weather data warehouse to answer these questions, potentially for _many_ places. I also have zero budget, so I think it would be cool to try building the data warehouse on a local machine using PostgreSQL with TimescaleDB. I don't know anything about them so it should be a good learning experience but it sounds like together they can be great for analyzing weather time series. And if we add PostGIS we'll be able to run temporal-geospatial queries too.

To get there though we first need to load all this data into Postgres and this is what this post is about. Initial attempts at loading the data seemed slow so I wanted to investigate how to do this fast, leading me down this rabbit hole.

Are we building a data warehouse? Maybe, I don't even know. Is a relational database even appropriate for gridded weather data? No idea, but TimescaleDB makes a good point.

## What's the data?

We are not working with actual weather observations. They are great, but can be sparse in certain regions. Instead, we will be working with ERA5 _reanalysis_ data[^era5-explanation]. It's our best estimate of the state of the Earth's weather. The data is output from a climate model run that is constrained to match weather observations. So where we have lots of weather observations, the data should match it closely. And where we do not have weather observations, the data should match the climatology, i.e. the statistics should match reality. Here are two snapshots of what this data looks like for at one point in time.

[^era5-explanation]: https://en.wikipedia.org/wiki/ECMWF_re-analysis

| ![Temperature](/img/insert_benchmarks/temperature_figure.png){: .centered width="100%"} |
|:--:|
| *Global snapshot of surface temperature at 2018-12-04 04:00:00 UTC. Move closer to title?* |

| ![Temperature](/img/insert_benchmarks/precipitation_figure.png){: .centered width="100%"} |
|:--:|
| *Global snapshot of precipitation rate at 2018-12-04 04:00:00 UTC.* |

So the data covers the entire globe at 0.25 degree resolution, and stretches back in time to 1940 with hourly resolution. Here's what a time series of temperature looks like at one location.

| ![Temperature](/img/insert_benchmarks/zoom_plot_temperature_Durban.png){: .centered width="100%"} |
|:--:|
| *Time series of surface temperature near Durban, South Africa.* |

Hourly data stretching back to 1940 is 727,080 snapshots in time for each variable like temperature, precipitation, cloud cover, wind speed, etc. And at 0.25 degree resolution we have 1,036,080 locations. Together that's 753,836,544,000 or ~754 billion rows of data if indexed by time and location. That's a good amount of data. And as I found out, it's not trivial to quickly shove this data into a relational database, much less be able to query it quickly.

I'm not sure if a relational database is the best way to work with this kind of clean, regular data. But I find it cumbersome to work with and query in the form in which it is distributed. The data is distributed as NetCDF[^netcdf-explanation] files indexed by time which makes it easy to query the dataset at single points in time, but looking at temporal patterns is very slow as many files need to be read to pull out a single time series. Complex geospatial queries, especially over time, will be slow and difficult to perform.
Can analyze them using xarray, dask, Pangeo stack, etc.

[^netcdf-explanation]: Explain NetCDF.

For this post we'll just load in temperature, zonal and meridional wind speeds, total cloud cover, precipitation, and snowfall for each time and location so we'll use this table schema:

```sql
create table (
    time timestamptz not null,
    location_id int,
    latitude float4,
    longitude float4,
    temperature_2m float4,
    zonal_wind_10m float4,
    meridional_wind_10m float4,
    total_cloud_cover float4,
    total_precipitation float4,
    snowfall float4
);
```

And before you mention database normalization, yes I have both a `location_id` column and `latitude` and `longitude` columns. It's for later benchmarking whether spatial queries benefit from a normalized `locations` table.

# The `insert` statement

## Starting with just the single-row `insert` statement

The simplest way to load data into a table is by using the `insert` command to insert a single row. This looks something like

```sql
insert into weather (
    time,
    location_id,
    latitude,
    longitude,
    temperature_2m,
    zonal_wind_10m,
    meridional_wind_10m,
    total_cloud_cover,
    total_precipitation,
    snowfall
) values ('1995-03-10 16:00:00+00', 346441, -30, 30.25, 15.466888,
          -2.0585022, 0.25202942, 0.9960022, 0.007845461, 0);
```

and so you can just loop over all the ERA5 data and do this. Unfortunately it is quite slow for populating a data warehouse as it does more than just insert data:

1. Postgres needs to parse the statement, validate table and column names, and plan the best way to execute it.
2. Postgres may need to lock the table to ensure data integrity.
3. The data is written to a buffer as Postgres uses a Write-Ahead Logging[^wal-explanation] (or WAL) system where changes are recorded in a log before writing them to the database for data durability and crash recovery.
4. Data from the buffer is actually inserted into the table on disk (which may involve navigating through and updating indexes).
5. If the `insert` statement is part of a transaction[^transaction-explanation] that is comitted, then the changes are made permanent.

So there's a lot of overhead associated with inserting single rows, especially if each `insert` gets its own transaction.

[^wal-explanation]: Explain WAL.

[^transaction-explanation]: Explain transactions.

How many rows can we actually insert per second using single-row inserts? I found three[^orm-explanation] ways to do it from Python so let's benchmark all three:

1. Pandas' `df.to_sql()` function with the `chunksize=1` keyword argument to force single-row inserts.
2. Psycopg3
3. SQLAlchemy

[^orm-explanation]: I wanted to try benchmarking SQLAlchemy ORM but: Can't do SQLAlchemy ORM as ORM requires a primary key, but Timescale hypertables do not support primary keys. This is because the underlying data must be partitioned to several physical PostgreSQL tables. Partitioned look-ups cannot support a primary key.

| ![Insert benchmarks](/img/insert_benchmarks/benchmarks_insert.png) |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

I benchmarked inserting into a regular Postgres table and a TimescaleDB hypertable[^hypertable-explanation].

[^hypertable-explanation]: Explain TimescaleDB hypertables.

Pandas and psycopg3 perform similarly, with a slight edge to psycopg3. SQLAlchemy is the slowest even though we're not using its Object-Relational Mapping (ORM) tool. This may because it introduces extra overhead with session management and compiled SQL expressions.

Inserting into TimescaleDB is a bit slower perhaps because it needs to figure out which chunk to insert the data into.

Well, at best we're only getting ~3000 inserts per second with single-row inserts at which rate we're gonna have to wait ~8 years for all the data to load. There must be a faster way.

## Multi-valued `insert`

* Explain what a multi-valued insert does under the hood. Why is it faster than a regular insert?

Write-Ahead Logging (or WAL)

```sql
insert into weather (
    time,
    location_id,
    latitude,
    longitude,
    temperature_2m,
    zonal_wind_10m,
    meridional_wind_10m,
    total_cloud_cover,
    total_precipitation,
    snowfall
) values
    ('1995-03-02 04:00:00+00', 346444, -30, 31, 21.54013,
     7.1091003, 5.9887085, 1, 2.7820282, 0),
    ('1995-03-02 05:00:00+00', 346444, -30, 31, 21.596466,
     7.0369415, 6.2397766, 0.95751953, 2.1944494, 0),
    ('1995-03-02 06:00:00+00', 346444, -30, 31, 21.660583,
     6.303482, 6.017273, 0.88571167, 1.9253268, 0);
```

| ![Multi-valued insert benchmarks](/img/insert_benchmarks/benchmarks_multi_insert.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the insert rate into a regular PostgreSQL table, while orange bars show the insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

* Explain why psycopg3 is fast and why sqlalchemy is slow.
* Talk about chunksize. What is used? Is there a sweet spot?

This is an order-of-magnitude improvement but at ~30k inserts per second, we're still gonna have to wait ~0.8 years or almost 10 months for all the data to load.

# The `copy` statement

## Upgrading to the `copy` statement

| ![Copy benchmarks](/img/insert_benchmarks/benchmarks_copy.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

## Parallel `copy`

| ![Parallel copy benchmarks](/img/insert_benchmarks/benchmarks_parallel_copy.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

## `copy` at scale

| ![Copy at scale benchmarks](/img/insert_benchmarks/benchmarks_copy_at_scale.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

# Tools

| ![Tool benchmarks](/img/insert_benchmarks/benchmarks_tools.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

tpc: We did 256 hours to see if it could keep up. Performance for the first minute (~50M rows?) could be really good (over 3 million rows inserted per second!) but it would always drop so sustained performance is lower.
tpc with lots of workers: bottleneck seemed to be the SSD where all the workers were writing to the DB, not the HDD where the data was being read from.

# So what's the best method?

Figure out which tool is best. How many hours/days/weeks to load the data?
What's the theoretical maximum based on SSD speed?

They mention that the largest tables ran into several TBs, and they would have soon topped the max IOPS supported by RDS. RDS for PostgreSQL peaks at 256,000 IOPS for a 64 TB volume.
We're already doing better than this on older hardware.

At a sustained ~500k inserts per second, we're waiting 17~18 days which is not bad.

# Appendices

## Source code

* Link to https://github.com/ali-ramadhan/how-much-climate-change/tree/main/benchmark_data_loading or spawn off a new repo just for this?

## Benchmarking methodology

Hardware:
* CPU: 2x 12-core Intel Xeon Silver 4214
* RAM: 16x 16 GiB Samsung M393A2K40CB2-CTD ECC DDR4 2666 MT/s
* SSD: Intel SSDPEKNW020T8 2 TB NvME

The hardware used is roughly 5 years old so newer hardware should be able to beat these benchmarks.

Software:
* Ubuntu with Linux kernel 5.15
* PostgreSQL
* TimescaleDB

* Mention hardware and environment.
* Mention how a fresh Docker container was spun up for each benchmark.

# Footnotes

* footnotes will be placed here. This line is necessary
{:footnotes}
