---
layout: post
title: "Building a weather data warehouse part I: Benchmarking loading 80 years of global weather data into PostgreSQL and TimescaleDB as fast as possible"
toc: true
---

| ![Temperature](/img/insert_benchmarks/temperature_figure.png) |
|:--:|
| *Global snapshot of surface temperature at 2018-12-04 04:00:00 UTC.* |

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

We are not working with actual weather observations. They are great, but can be sparse in certain regions. Instead, we will be working with the ERA5 climate reanalysis product[^era5-explanation]. It's our best estimate of the state of the Earth's weather. The data is output from a climate model run that is constrained to match weather observations. So where we have lots of weather observations, ERA5 should match it closely. And where we do not have any weather observations, ERA5 will be physically consistent and should match the climatology, i.e. weather statistics should match reality. At the top is a snapshot of what ERA5 temperature looks like and below is a snapshot of precipitation.

[^era5-explanation]: ERA5 is the latest [climate reanalysis](https://en.wikipedia.org/wiki/Atmospheric_reanalysis) product produced by the [ECMWF re-analysis](https://en.wikipedia.org/wiki/ECMWF_re-analysis) project.

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

[^netcdf-explanation]: [NetCDF](https://en.wikipedia.org/wiki/NetCDF) (Network Common Data Form) files are ubiquitous in distributing output data from weather and climate models. They typically store multi-dimensional arrays for each variable output along with enough metadata that you don't need to refer to external documentation to use the data. The good ones do this at least.

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
3. The data is written to a buffer as Postgres uses a write-ahead logging[^wal-explanation] (or WAL) system.
4. Data from the buffer is actually inserted into the table on disk (which may involve navigating through and updating indexes).
5. If the `insert` statement is part of a transaction[^transaction-explanation] that is committed, then the changes are made permanent.

So there's a lot of overhead associated with inserting single rows, especially if each `insert` gets its own transaction.

[^wal-explanation]: [Write-ahead logging](https://en.wikipedia.org/wiki/Write-ahead_logging) is how Postgres ensures data integrity and database recovery after crashes. All committed transactions are recorded in a WAL file before being applied to the database. In the event of a crash or power failure, the database can recover all committed transactions from the WAL file so the database can always be brought back to a consistent, uncorrupted state.

[^transaction-explanation]: [Postgres transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) execute multiple operations as a single atomic unit of work so that either all operations execute successfully (and are written to WAL on disk), or none are applied. This ensures the database is always in a consistent state even if something goes wrong in the middle of a transaction.

How many rows can we actually insert per second using single-row inserts? After loading the data from NetCDF into a pandas dataframe I found three[^orm-explanation] ways to insert the data into Postgres from Python so let's benchmark all three:

1. pandas: You can insert data straight from a dataframe using the `df.to_sql()` function with the `chunksize=1` keyword argument to force single-row inserts.
2. psycopg3: You can use [parameterized queries](https://www.psycopg.org/psycopg3/docs/basic/params.html) to protect against [SQL injection](https://en.wikipedia.org/wiki/SQL_injection), not that it's a risk here (yet) but it's good to practice safety I guess. All inserts are part of one transaction that is committed at the end.
3. SQLAlchemy: You can use named parameters in a parameterized query to prevent SQL injection attacks.

[^orm-explanation]: I wanted to try a fourth method using SQLAlchemy's Object Relational Mapper (ORM) which maps rows in a database to Python objects. But, the ORM requires a primary key and Timescale hypertables do not support primary keys. This is because the underlying data must be partitioned to several physical PostgreSQL tables and partitioned lookups cannot support a primary key. ORM was probably going to be the slowest at inserting due to extra overhead anyways.

| ![Insert benchmarks](/img/insert_benchmarks/benchmarks_insert.png) |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark inserted 20k rows and was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

I benchmarked inserting into a regular Postgres table and a TimescaleDB hypertable[^hypertable-explanation].

[^hypertable-explanation]: TimescaleDB hypertables automatically partition data by time into _chunks_ and have extra features that make working with time-series data easier and faster.

Pandas and psycopg3 perform similarly, with a slight edge to psycopg3. SQLAlchemy is the slowest even though we're not using its ORM tool. This may because it introduces extra overhead with its abstractions around session management and compiled SQL expressions.

TODO: Check how SQLAlchemy is committing transaction.

Inserting into a Timescale hypertable is a bit slower. This is maybe because rows are being inserted into a hypertable with chunks so there may be some overhead there, even if there's only one chunk which should be true since this benchmark only inserts 20k rows. There may also be additional overhead with transactions in Timescale.

So at best we're only getting ~3000 inserts per second with single-row inserts at which rate we're gonna have to wait ~8 years for all the data to load. There must be a faster way.

## Multi-valued `insert`

You can insert multiple rows with one `insert` statement. This is called a multi-valued or bulk insert and looks like this:

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

This is faster for a few reasons. There's less network overhead as each single-row insert requires a network round trip for each row inserted. Postgres also only has to parse and plan once. Multi-row inserts can also be further optimized when it comes to updating indexes. It seems that you can bulk insert as many rows as you want as long as they fit in memory (or get too big that it's detrimental).

| ![Multi-valued insert benchmarks](/img/insert_benchmarks/benchmarks_multi_insert.png) |
|:--:|
| *Blue bars show the insert rate into a regular PostgreSQL table, while orange bars show the insert rate into a TimescaleDB hypertable. Each benchmark inserted 100k rows and was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

* Explain why psycopg3 is fast and why sqlalchemy is slow.
* Talk about chunksize. What is used? Is there a sweet spot?

With multi-row inserts there's an order-of-magnitude improvement but at ~30k inserts per second, we're still gonna have to wait ~0.8 years or almost 10 months for all the data to load.

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

# Unlogged tables

Can benchmark inserting into an unlogged hypertable. Then benchmark doing that and then turning the table into a hypertable?

# So what's the best method?

Figure out which tool is best. How many hours/days/weeks to load the data?
What's the theoretical maximum based on SSD speed?

They mention that the largest tables ran into several TBs, and they would have soon topped the max IOPS supported by RDS. RDS for PostgreSQL peaks at 256,000 IOPS for a 64 TB volume.
We're already doing better than this on older hardware.

At a sustained ~500k inserts per second, we're waiting 17~18 days which is not bad.

# Appendices

## Source code

Link to https://github.com/ali-ramadhan/how-much-climate-change/tree/main/benchmark_data_loading or spawn off a new repo just for this?

## Benchmarking methodology

The hardware used is roughly 5 years old so newer hardware should be able to beat these benchmarks.

Hardware:
* CPU: 2x 12-core Intel Xeon Silver 4214
* RAM: 16x 16 GiB Samsung M393A2K40CB2-CTD ECC DDR4 2666 MT/s
* SSD: Intel SSDPEKNW020T8 2 TB NvME

Software:
* Ubuntu with Linux kernel 5.15
* PostgreSQL 15.5
* TimescaleDB 2.13.0

Postgres configuration:
```plaintext
timescaledb_weather | shared_buffers = 64144MB
timescaledb_weather | effective_cache_size = 192434MB
timescaledb_weather | maintenance_work_mem = 2047MB
timescaledb_weather | work_mem = 13684kB
timescaledb_weather | timescaledb.max_background_workers = 16
timescaledb_weather | max_worker_processes = 67
timescaledb_weather | max_parallel_workers_per_gather = 24
timescaledb_weather | max_parallel_workers = 48
timescaledb_weather | Writing backup to:
timescaledb_weather | /tmp/timescaledb_tune.backup202403180500
timescaledb_weather |
timescaledb_weather | Recommendations based on 250.57 GB of available memory and 48 CPUs for PostgreSQL 15
timescaledb_weather | wal_buffers = 16MB
timescaledb_weather | min_wal_size = 512MB
timescaledb_weather | default_statistics_target = 100
timescaledb_weather | random_page_cost = 1.1
timescaledb_weather | checkpoint_completion_target = 0.9
timescaledb_weather | max_locks_per_transaction = 512
timescaledb_weather | autovacuum_max_workers = 10
timescaledb_weather | autovacuum_naptime = 10
timescaledb_weather | effective_io_concurrency = 256
```

* Mention hardware and environment.
* Mention how a fresh Docker container was spun up for each benchmark.

# Footnotes

* footnotes will be placed here. This line is necessary
{:footnotes}
