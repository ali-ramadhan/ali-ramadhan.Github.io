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
| *Blue bars show the insert rate into a regular PostgreSQL table, while orange bars show the insert rate into a TimescaleDB hypertable. Each benchmark was run 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.* |

* Explain why we're seeing differences.
* Explain why inserting into TimescaleDB is slower.

Well, at only ~3000 inserts per second, we're gonna have to wait ~8 years for all the data to load.

## Appendix: Benchmarking methodology

* Mention hardware and environment.
* Mention how a fresh Docker container was spun up for each benchmark.
