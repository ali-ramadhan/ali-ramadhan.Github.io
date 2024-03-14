---
layout: post
title: Loading weather data into PostgreSQL and TimescaleDB as fast as possible
---

Data TODO:
* Run parallel tool benchmarks. Can only run timescaledb-parallel-copy since pg_bulkload doesn't do multithreading.

## What are we even doing?

We have _tons_ of weather data we can analyze to look for signals of climate change.
Include? The data is output from a climate model run that is constrained to match weather observations. So where we have lots of weather observations, the data should match it closely. And where we do not have weather observations, the data should match the climatology, i.e. the statistics should match reality.
ERA5 now has data stretching back to 1940.
Global snapshots of variables like temperature or precipitation. The dataset has ~727k snapshots for each variable.
Long timeseries for each grid point. The dataset has ~1 million such time series for each variable.
We might want to look at localized temporal patterns, e.g. how much warmer is Dallas these days compared to previous decades? Is Dallas getting drier or wetter?
We might want to look for geospatial patterns.
We might want to look at both: e.g. how much warmer is Chile? Is it getting cloudier in the Japanese province of Sapporo?
Instead of using climate model predictions, which can have lots of uncertainty but do have lots of singal, why not dig into this trove of past weather data to answer questions about climate change.
The data is distributed as NetCDF files indexed by time which makes it easy to query the dataset at single points in time, but looking at temporal patterns is very slow as many files need to be read to pull out a single time series. Complex geospatial queries, especially over time, will be slow and difficult to perform.
You might want to run this kind of analysis in many places so we need _fast_queries.
I'm hoping that PostgreSQL with TimescaleDB can be great for analyzing weather time series. And with PostGIS we'll be able to run fast temporal-geospatial queries too. But to get there we first need to load all this data into Postgres and this is what this post is about.

| ![Temperature](/img/insert_benchmarks/temperature_figure.png){: .centered width="100%"} |
|:--:|
| *Temperature.* |

| ![Temperature](/img/insert_benchmarks/precipitation_figure.png){: .centered width="100%"} |
|:--:|
| *Precipitation.* |

| ![Temperature](/img/insert_benchmarks/zoom_plot_temperature_Durban.png){: .centered width="100%"} |
|:--:|
| *Temperature in Durban.* |



* I want to analyze ERA5 data using complex queries _quickly_. Maybe temporal queries at first, i.e. acting on time series then spatiotemporal later.
* What's ERA5?
* It comes as NetCDF files. What's that?
* Can analyze them using xarray, dask, Pangeo stack, etc.
* But this is slow because the data is chunked in time. So reading a time series from disk can be extremely slow.
* I want to see if PostgreSQL can help. And TimescaleDB looks promising. Also good opportunity to learn both.
* Initial attempts at loading the data seemed slow so I wanted to investigate how to do this fast, leading me down this rabbit hole.
* Found some existing articles on this but not satisfied. Should I say this?
* Are we building a data warehouse? Maybe, I don't even know.
* Is a relational database even appropriate for gridded weather data? No idea, but TimescaleDB makes a good point.

## What's the data?

* 727,080 snapshots in time.
* 1,036,800 locations
* How much data? How many rows? The data stretches back to 1940 so that's roughly (83 years) * (24*365 hours per year) * (360/0.25 * 180/0.25 grid points) ≈ 754 billions rows.

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

And before you scream about the third normal form, yes I have both a `location_id` column and `latitude` and `longitude` columns for now so I can benchmark whether spatial queries benefit from a normalized `locations` table.

## Starting with just the `insert` statement

* Explain what an insert does under the hood. Why is it slow?

This looks something like

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
) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
```

although if you have a Pandas dataframe, you could just use `df.to_sql` with the `chunksize=1` kwarg.

| ![Insert benchmarks](/img/insert_benchmarks/benchmarks_insert.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

* Explain why we're seeing differences.
* Explain why inserting into TimescaleDB is slower.

Well, at only ~3000 inserts per second, we're gonna have to wait ~8 years for all the data to load.

## Multi-valued `insert`

* Explain what a multi-valued insert does under the hood. Why is it faster than a regular insert?

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
    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s),
    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s),
    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
```

| ![Multi-valued insert benchmarks](/img/insert_benchmarks/benchmarks_multi_insert.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the insert rate into a regular PostgreSQL table, while orange bars show the insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

* Explain why psycopg3 is fast and why sqlalchemy is slow.
* Talk about chunksize. What is used? Is there a sweet spot?

This is an order-of-magnitude improvement but at ~30k inserts per second, we're still gonna have to wait ~0.8 years or almost 10 months for all the data to load.

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

## Tools

| ![Tool benchmarks](/img/insert_benchmarks/benchmarks_tools.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

## Appendix: Source code

* Link to https://github.com/ali-ramadhan/how-much-climate-change/tree/main/benchmark_data_loading or spawn off a new repo just for this?

## Appendix: Benchmarking methodology

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

## Appendix: Notes

1. Wanted to try benchmarking SQLAlchemy ORM but: Can't do SQLAlchemy ORM as ORM requires a primary key, but Timescale hypertables do not support primary keys. This is because the underlying data must be partitioned to several physical PostgreSQL tables. Partitioned look-ups cannot support a primary key.
