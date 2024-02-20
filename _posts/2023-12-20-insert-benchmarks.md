---
layout: post
title: Loading weather data into PostgreSQL and TimescaleDB as fast as possible
---

* Show a frame from the ERA5 temperature movie.
* Show a time series from one location?

## What are we even doing?

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

* 1036800 locations
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

| ![Insert benchmarks](/img/insert_benchmarks/benchmarks_multi_insert.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the insert rate into a regular PostgreSQL table, while orange bars show the insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

* Explain why psycopg3 is fast and why sqlalchemy is slow.
* Talk about chunksize. What is used? Is there a sweet spot?

This is an order-of-magnitude improvement but at ~30k inserts per second, we're still gonna have to wait ~0.8 years or almost 10 months for all the data to load.

## Upgrading to the `copy` statement

| ![Insert benchmarks](/img/insert_benchmarks/benchmarks_copy.png){: .centered width="80%"} |
|:--:|
| *Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |


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
