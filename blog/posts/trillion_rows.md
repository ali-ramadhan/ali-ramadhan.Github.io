---
layout: "blog-post"
title: "Building a weather data warehouse part I: Loading a trillion rows of weather data into TimescaleDB"
date: 2024-03-31
collapsible_headers: true
github_discussion: https://github.com/ali-ramadhan/ali-ramadhan.Github.io/discussions/2
hacker_news: https://news.ycombinator.com/item?id=40051191
---

[[toc]]

::: figure centered width-120
![global surface temperature snapshot](/assets/images/blog/trillion_rows/temperature_figure.png)

Global snapshot of surface temperature at 2018-12-04 04:00:00 UTC.
:::

## What are we even doing?

### Why build a weather data warehouse?

I think it would be cool to have historical weather data from around the world to analyze for signals of climate change we've _already_ had rather than think about potential future change.

If we had a huge weather data warehouse we could query it to figure out whether Jakarta is actually warmer or stormier these days and exactly how is it warmer (heat waves, winter highs, etc.). Or whether Chile is warming or getting cloudier as a whole, which could be region-specific. We could do this kind of analysis for every city or region on Earth to find out which places have already experienced the most climate change and what kind of change.

But to do this analysis globally we need to make querying the data warehouse fast, and there's a lot of data. The first step is to load the data into a database of some kind. I'm going to try using PostgreSQL here. It should be a good learning experience and using TimescaleDB to speed up time-based queries and eventually PostGIS to speed up geospatial queries seems promising.

To get there though we first need to load all this data into Postgres and this is what this post is about. Initial attempts at loading the data seemed slow so I wanted to investigate how to do this fast, leading me down a rabbit hole and me writing this.[^postgres-guide]

[^postgres-guide]: The Postgres documentation does have a nice list of performance tips for [populating a database](https://www.postgresql.org/docs/current/populate.html) but I wanted some benchmarks and to consider some external tools as well.

Are we building a data warehouse? I think so...? Is a relational database even appropriate for gridded weather data? No idea but we'll find out.

### What's the data?

We are not working with actual weather observations. They are great, but can be sparse in certain regions especially in the past. Instead, we will be working with the ERA5 climate reanalysis product[^era5-explanation]. It's our best estimate of the historical state of the Earth's weather and is widely used in weather and climate research.

[^era5-explanation]: ERA5 is the latest [climate reanalysis](https://en.wikipedia.org/wiki/Atmospheric_reanalysis) product produced by the [ECMWF re-analysis](https://en.wikipedia.org/wiki/ECMWF_re-analysis) project. ECMWF is the [European Centre for Medium-Range Weather Forecasts](https://en.wikipedia.org/wiki/European_Centre_for_Medium-Range_Weather_Forecasts).

The data is output from a climate model run that is constrained to match weather observations. So where we have lots of weather observations, ERA5 should match it closely. And where we do not have any weather observations, ERA5 will be physically consistent and should match the climatology, i.e. the simulated weather's statistics should match reality. At the top of this page is a snapshot of what global surface temperature looks like and below is a snapshot of global precipitation.

::: figure centered width-120
![global precipitation snapshot](/assets/images/blog/trillion_rows/precipitation_figure.png)

Global snapshot of precipitation rate at 2018-12-04 04:00:00 UTC.
:::

Here's what a time series of temperature looks like at one location.

::: figure centered width-80
![temperature time series](/assets/images/blog/trillion_rows/zoom_plot_temperature_Durban.png)

Time series of surface temperature near Durban, South Africa.
:::

ERA5 covers the entire globe at 0.25 degree resolution, and stretches back in time to 1940 with hourly resolution. Hourly data stretching back to 1940 is 727,080 snapshots in time for each variable like temperature, precipitation, cloud cover, wind speed, etc. A regularly-spaced latitude-longitude grid at 0.25 degree resolution has 1,038,240 grid points or locations (1440 longitudes and 721 latitudes including both poles). Together that's 753,836,544,000 or ~754 billion rows of data if indexed by time and location. That's a good amount of data. And as I found out, it's not trivial to quickly shove this data into a relational database, much less be able to query it quickly.

The ERA5 data is distributed as NetCDF[^netcdf-explanation] files. You can query an API for the data or download it from certain providers but generally each file contains data for a day, a month, or a year. This chunking by time makes it quick and easy to query the dataset at single points in time, but looking at temporal patterns is very slow as many files need to be read to pull out a single time series. It takes like 20~30 minutes to pull out temperature data for one location to make the plot above! Complex geospatial queries, especially over time, will be slow and difficult to perform. Packages like [xarray](https://xarray.dev/) and [dask](https://www.dask.org/) (and efforts by [Pangeo](https://pangeo.io/)) speed things up but it's still a slow process.

[^netcdf-explanation]: [NetCDF](https://en.wikipedia.org/wiki/NetCDF) (Network Common Data Form) files are ubiquitous in distributing model output in climate science, atmospheric science, and oceanography. They typically store multi-dimensional arrays for each variable output along with enough metadata that you don't need to refer to external documentation to understand and use the data. The good ones do this at least.

We'll just load in temperature, zonal and meridional wind speeds, total cloud cover, precipitation, and snowfall for each time and location so we'll use this table schema:

```sql
create table weather (
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

And before you mention database normalization, yes I have both a `location_id` column and `latitude` and `longitude` columns. It's for later benchmarking with queries and indexes.

## The `insert` statement

### Starting with just the single-row `insert` statement

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

and so you can just loop over all the data doing this row-by-row. Unfortunately it is quite slow as quite a bit goes on behind the scenes here:

1. Postgres needs to parse the statement, validate table and column names, and plan the best way to execute it.
2. Postgres may need to lock the table to ensure data integrity.[^mvcc-explanation]
3. The data is written to a buffer as Postgres uses a write-ahead logging[^wal-explanation] (or WAL) system.
4. Data from the buffer is actually inserted into the table on disk (which may involve navigating through and updating indexes, but we won't have any here).
5. If the `insert` statement is part of a transaction[^transaction-explanation] that is committed, then the changes are made permanent.

So there's a lot of overhead associated with inserting single rows, especially if each `insert` gets its own transaction.

[^mvcc-explanation]: Postgres may need to perform a full table lock for some operations that modify the entire table. But for row-level operations no locking is necessary as Postgres uses [multiversion concurrency control](https://en.wikipedia.org/wiki/Multiversion_concurrency_control) (MVCC) to allow multiple transactions to operate on the database concurrently. Each transaction sees a version of the database as it was when the transaction began.

[^wal-explanation]: [Write-ahead logging](https://en.wikipedia.org/wiki/Write-ahead_logging) is how Postgres ensures data integrity and database recovery after crashes. All committed transactions are recorded in a WAL file before being applied to the database. In the event of a crash or power failure, the database can recover all committed transactions from the WAL file so the database can always be brought back to a consistent, uncorrupted state.

[^transaction-explanation]: [Postgres transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) execute multiple operations as a single atomic unit of work so that either all operations execute successfully (and are written to WAL on disk), or none are applied. This ensures the database is always in a consistent state even if something goes wrong in the middle of a transaction.

How many rows can we actually insert per second using single-row inserts? After loading the data from NetCDF into a pandas dataframe I found three[^orm-explanation] ways to insert the data into Postgres from Python so let's benchmark all three:

1. **pandas**: You can insert data straight from a dataframe using the `df.to_sql()` function with the `chunksize=1` keyword argument to force single-row inserts.
2. **psycopg3**: You can use [parameterized queries](https://www.psycopg.org/psycopg3/docs/basic/params.html) to protect against [SQL injection](https://en.wikipedia.org/wiki/SQL_injection), not that it's a risk here (yet) but it's good to practice safety I guess. All inserts are part of one transaction that is committed at the end.
3. **SQLAlchemy**: You can similarly use named parameters in a parameterized query to prevent SQL injection attacks.

[^orm-explanation]: I wanted to try a fourth method using SQLAlchemy's [Object Relational Mapper](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping) (ORM) which maps rows in a database to Python objects. But, the ORM requires a primary key and Timescale hypertables do not support primary keys. This is because the underlying data must be partitioned to several physical PostgreSQL tables and partitioned lookups cannot support a primary key. ORM was probably going to be the slowest at inserting due to extra overhead anyways.

::: figure centered width-80
![single-row insert benchmarks](/assets/images/blog/trillion_rows/benchmarks_insert.png)

Blue bars show the median insert rate into a regular PostgreSQL table, while orange bars show the median insert rate into a TimescaleDB hypertable. Each benchmark inserted 20k rows and was repeated 10 times. The error bars show the range of insert rates given by the 10th and 90th percentiles.
:::

I benchmarked inserting into a regular Postgres table and a TimescaleDB hypertable[^hypertable-explanation].

[^hypertable-explanation]: TimescaleDB hypertables automatically partition data by time into _chunks_ and have extra features that make working with time-series data easier and faster.

Pandas and psycopg3 perform similarly, with a slight edge to psycopg3. SQLAlchemy is the slowest even though we're not using its ORM tool. This may be because it introduces extra overhead with its abstractions around session management and compiled SQL expressions.

Inserting into a Timescale hypertable is a bit slower. This is maybe because rows are being inserted into a hypertable with chunks so there may be some overhead there, even if there's only one chunk.

So at best we're only getting ~3000 inserts per second with single-row inserts at which rate we're gonna have to wait ~8 years for all the data to load 🦥 There must be a faster way.

### Multi-valued `insert`

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

This is faster for a few reasons. There's less network overhead as each single-row insert requires a network round trip for each row inserted. Postgres also only has to parse and plan once. Multi-row inserts can also be further optimized when it comes to updating indexes. It seems that you can bulk insert as many rows as you want as long as they fit in memory.

In pandas it sounds like you can do this by passing the `method="multi"` keyword argument to the `df.to_sql()` function but I found this to be a bit slower than single-row inserts with `chunksize=1`. So I just didn't set a method or chunk size and supposedly all rows will be written at once, and it was faster. With psycopg3 you can construct or stream a list of tuples, one for each row, and insert them all at once. With SQLAlchemy it's a dict of tuples.

::: figure centered width-80
![multi-valued insert benchmarks](/assets/images/blog/trillion_rows/benchmarks_multi_insert.png)

This time each benchmark inserted 100k rows and was repeated 10 times.
:::

Now there's a clear winner with psycopg3 at 25~30k inserts/sec. I'm not sure why psycopg3 is faster but it looks like pandas is [using dictionaries to insert](https://github.com/pandas-dev/pandas/blob/a671b5a8bf5dd13fb19f0e88edc679bc9e15c673/pandas/io/sql.py#L938-L968) which can be slower than just plain tuples. SQLAlchemy might be extra slow slow here because of additional overhead like with single-row inserts and I also passed it dictionaries.

With multi-row inserts there's an order-of-magnitude improvement but at ~30k inserts per second, we're still gonna have to wait ~0.8 years or almost 10 months for all the data to load 🐢

## The `copy` statement

### Upgrading to the `copy` statement

For loading in larger amounts of data, Postgres has the `copy` statement allowing us to insert rows from a CSV file or from a binary file.[^copy-binary-note] `copy` is faster than multi-row inserts as Postgres reads data straight from the file and optimizes parsing, planning, and WAL usage knowing there is a lot of data to load.

[^copy-binary-note]: Binary is _usually_ a more compact representation for floats and timestamps than plaintext so I was hoping to also benchmark `copy` with the binary format thinking it might be much faster. Unfortunately the [format Postgres expects](https://www.postgresql.org/docs/current/sql-copy.html) seems non-trivial and I couldn't easily find a library that would give me the binary format I needed. And [Nick Babcock](https://nickb.dev/blog/disecting-the-postgres-bulk-insert-and-binary-format/) actually found that binary is no faster than csv, so it didn't seem worth trying. For reference, 31 days of ERA5 data takes up 7.8 GiB in NetCDF form and 71 GiB in CSV form.

Once you have a CSV file it's as simple as

```sql
copy weather from some_big.csv delimiter ',' csv header;
```

We have the option of saving data from NetCDF files as CSV files then using `copy`. This honestly feels inefficient as saving timestamps and floating-point numbers as plaintext to disk takes up more space that it should then reading it from disk seems like it would be slow, but Postgres seems to have optimized this operation. We also have the option of not saving the data into CSV files and streaming it straight into Postgres using psycopg3's `cusor.copy()` function.

When benchmarking `copy` vs. `psycopg3.cursor.copy()` we are starting with a pandas dataframe so we must account for the time it takes to save all the data to CSV files on disk in the case of `copy csv`. In the case of `cursor.copy()` if we stream a list of tuples then the only overhead is creating the cursor and tuple generator.

::: figure centered width-80
![copy benchmarks](/assets/images/blog/trillion_rows/benchmarks_copy.png)

Here the full rate includes overhead (writing CSV files or constructing tuples) while the copy rate does not. This time each benchmark inserted 1,038,240 rows (1 day of ERA5 data) and was repeated 10 times.
:::

We see that `copy` can actually insert close to 400k rows per second, but that is if you already have the CSV file ready to go. Including overhead, both `copy` and psycopg3 can manage around 100k inserts/second with psycopg3 being a bit faster. For some reason there seems to be no difference between regular table and hypertable performance for psycopg3.

At ~100k inserts/second we're still talking about ~3 months to load all the data 🐌

### Sustaining `copy` insert rates

When inserting _many_ rows, Postgres may encounter bottlenecks[^write-bottlenecks] so it's important that the insert rate can be sustained. To look at this, we can insert hundreds of millions of rows and watch for fluctuations in the insert rate.

[^write-bottlenecks]: Bottlenecks include the disk being overloaded with writes, usually made worse when the WAL and row insertion are competing for disk I/O. Autovacuuming, which removes dead rows, can also compete for I/O although when populating a database we can ensure that there won't be any duplicates so this could potentially be turned off. Postgres also periodically performs checkpoints to flush all outstanding WAL data to disk. Heavy writes can lead to more checkpoints and more competitinon for I/O.

::: figure centered width-80
![copy at scale benchmarks](/assets/images/blog/trillion_rows/benchmarks_copy_at_scale.png)

For this benchmark, rows were inserted in 744 batches of 1,038,240 rows for a total of ~772 million rows. The overall insert rate is plotted. The dots show the insert rate for each batch while the solid lines show a 10-batch rolling mean. The straight horizontal lines show the mean insert rate over the entire benchmark. Note that the lines orange and blue straight lines are right on top of each other.
:::

It seems that, at least with one worker, we don't see huge drops in insert rates although `copy csv` shows frequent drops and seems more susceptible to fluctuations. psycopg3 is generally faster and interestingly there isn't much of a difference between copying into a regular table or hypertable.

### Parallel `copy`

Inserting data with `copy` is fast but can we speed it up by executing multiple `copy` operations in parallel? Using the joblib package we can execute multiple `copy` statements or psycopg3 cursors in parallel.

::: figure centered width-80
![parallel copy benchmarks](/assets/images/blog/trillion_rows/benchmarks_parallel_copy.png)

The overall insert rate is plotted as a function of the number of workers. Each benchmark inserted 128 hours of ERA5 data (~133 million rows).
:::

Inserting data into a single table is not super parallelizable so it looks like performance generally plateaus after 16 workers.[^better-parallel-benchmark]

[^better-parallel-benchmark]: I probably should have run the parallel `copy` benchmarks using more rows to measure a better sustained rate. I wish there was an easy way to keep track of the total number of rows when inserting many rows in parallel but querying the row count seems very slow as Postgres is busy. I guess I could log a timestamp every time a worker inserted a batch of rows. Also wish I repeated this benchmark but it takes quite a while to run.

## Tools

### pg_bulkload and timescaledb-parallel-copy

Beyond the `copy` statement, there are external tools for loading large amounts of data into Postgres. I'll benchmark two of them, [pg_bulkload](https://github.com/ossc-db/pg_bulkload) and [timescaledb-parallel-copy](https://github.com/timescale/timescaledb-parallel-copy).

::: figure centered width-80
![tools benchmarks](/assets/images/blog/trillion_rows/benchmarks_tools.png)

Blue and orange bars show results from benchmarks that inserted 1,038,240 rows (1 day of ERA5 data) and were repeated 10 times. The sustained insert rates are from benchmarks that inserted 256 hours of ERA5 data (~266 million rows) into a hypertable. In these benchmarks the CSV files were already written to disk so the insert rate corresponds to the "copy rate" from the copy benchmarks. The insert rate including overhead accounts for the time it takes to write the CSV files to disk.
:::

At first it would seem that pg_bulkload is much faster, however, this is because by default it bypasses the shared buffers and skips WAL logging so data recovery following a crash may not be possible while timescaledb-parallel-copy does not and does things more safely. On a level playing field with `fsync` off (see next section for an explanation) timescaledb-parallel-copy with multiple workers beats out pg_bulkload.

### Multiple workers with timescaledb-parallel-copy

timescaledb-parallel-copy lets you specify the number of workers inserting data in parallel. Let's see how much performance we can squeeze out with more workers, and if that performance can be sustained.

::: figure centered width-80
![timescaledb-parallel-copy benchmarks](/assets/images/blog/trillion_rows/benchmarks_parallel_tpc.png)

The insert rate as a function of the number of rows inserted. In this benchmark the CSV files were already written to disk so the insert rate corresponds to the "copy rate" from the copy benchmarks. Each benchmark inserted 256 hours of ERA5 data (~266 million rows). Note the vertical log scale.
:::

Initial performance looks great! But eventually, before 100 million rows on my system, a bottleneck is reached and the insert rate tanks before picking back up in waves. The maximum sustained insert rate is around 600~700k inserts/sec for regular tables and ~300k for hypertables.

pg_bulkload doesn't let you specify the number of threads or workers, but does have a `writer=parallel` option which uses multiple threads to do data reading, parsing and writing in parallel. We'll look at its insert rate later.

## Tweaking Postgres settings

There are a couple of other things we can try to speed up inserts, but are basically some form of tweaking [Postgres' non-durable settings](https://www.postgresql.org/docs/current/non-durability.html).

Some extra performance can be squeezed out of tweaking non-durable settings specifically for loading data following suggestions by [Craig Ringer on StackOverflow](https://stackoverflow.com/a/12207237). Some of the settings can be dangerous for database integrity in the event of a crash though. The main settings to change are turning off `fsync` to avoid flushing data to disk and also turning off `full_page_writes` to avoid guarding against partial page writes.

You can also insert data into an unlogged table that generates no WAL and gets truncated upon crash recovery but is faster to write into. While inserting into an unlogged table might be fast, you still have to convert it to a regular logged table afterwards which can be a [slow single-threaded process](https://dba.stackexchange.com/a/195829). And hypertables cannot be unlogged, so if you want a hypertable you need to further convert/migrate the regular logged table to a hypertable which can also be slow.

## So what's the best method?

**Short answer: Use psycopg3 to directly copy data into a hypertable. If you already have CSV files then use timescaledb-parallel-copy. For parallelization the sweet spot seems to be 12~16 workers on my system.**

We want to end up with a hypertable but it seems like inserting into a regular table is faster. So is it faster to insert into a regular table then convert it to a hypertable? Or is it faster to just insert data straight into a hypertable?

::: figure centered width-50
![table conversion time](/assets/images/blog/trillion_rows/conversion_time.png)

Blue bars show the wall clock time taken to insert data into the table and the orange bar shows the time taken to convert the regular table into a hypertable.
:::

A quick test with inserting ~772 million rows with psycopg3's copy and 16 workers shows that inserting data into a hypertable is faster as it takes roughly 80% of the time in this case. This may not always be the case but inserting into a regular table then converting it to a hypertable and migrating the data will probably always be slower as the conversion/migration process is not super fast and seems to be single-threaded.

Now that we've concluded we want to be inserting data into a hypertable, let's take a look at the all hypertable insert rates we've considered in one plot.

::: figure centered width-120
![benchmarks summary](/assets/images/blog/trillion_rows/benchmarks_summary.png)

Sustained hypertable insert rates including overhead (writing CSV files) for different insertion methods. Here "tpc" is short for timescaledb-parallel-copy and "pgb" is short for pg_bulkload. "32W" means 32 workers were used for that benchmark.
:::

For pg_bulkload with a single worker the the `writer=buffered` option was used. For multiple workers, the `writer=buffered` and `multi_process=yes` options were used. Then for multiple workers with fsync off, the `writer=parallel` option was used.

So what can we conclude?

1. At least on my hardware it seems there's a ceiling of ~140k sustained inserts/sec with overhead when using a single worker with protections on. pg_bulkload wins here by quite a bit.
2. You can use multiple workers to increase the sustained insert rate up to ~250k inserts/sec with psycopg3's copy cursor while still being protected.
3. The insertion process is not very parallelizable so the sweet spot is 4-16 workers. The benchmarks used 32 workers to maximize insert rates.
4. If you're okay living a bit dangerously you can turn off fsync and sustain an insert rate of ~462k inserts/sec with psycopg3! You'll also squeeze out a bit more performance out of timescaledb-parallell-copy.
5. Be careful when using pg_bulkload as it disables `fsync` by default.
6. These conclusions assume you need to do extra work to convert data to CSV files which is why psycopg3 was the clear winner, although it does seem pretty fast. If you're starting with CSV files timescaledb-parallel-copy is probably faster (and quicker to set up).

Some closing thoughts:

1. Want even faster inserts? You should probably upgrade your hardware. A nice enterprise-grade NvME SSD and lots of high-speed DDR5 RAM will help a lot. I used hardware that is roughly 5 years old so newer hardware should be able to easily beat these benchmarks.
2. I know the general wisdom is to just dump this data into Snowflake or BigQuery and get fast analytics for relatively cheap. But I like working with my own hardware and learning this way. Plus I have no real budget for this project.
3. I'd be curious how ClickHouse performs on these benchmarks. My impression is that it would probably be faster out of the box. But I want to learn PostgreSQL and like the fact that TimescaleDB is just a Postgres extension so I went with TimescaleDB.

At a sustained ~462k inserts per second, we're waiting ~20 days for our ~754 billion rows which is not bad I guess 🐨 It's less time than it took me to write this post.

## Appendices

### Source code

The code used to download the ERA5 data, create the tables, insert/copy data, run benchmarks, and plot figures is at the [timescaledb-insert-benchmarks](https://github.com/ali-ramadhan/timescaledb-insert-benchmarks) repository.

### Benchmarking methodology

To ensure a consistent environment for benchmarking, a new Docker container was spun up for each individual benchmark. No storage was persisted between Docker containers. Data including NetCDF and CSV files were read from a HDD and the database was stored on an NvME SSD.

Hardware:

- CPU: 2x 12-core Intel Xeon Silver 4214
- RAM: 16x 16 GiB Samsung M393A2K40CB2-CTD ECC DDR4 2666 MT/s
- SSD: Intel SSDPEKNW020T8 2 TB NvME
- HDD: Seagate Exos X16 14TB 7200 RPM 256MB Cache

Software:

- Ubuntu 20.04 with Linux kernel 5.15
- PostgreSQL 15.5
- TimescaleDB 2.13.0
- pg_bulkload 3.1.20

Postgres configuration chosen by `timescaledb-tune`:

```plaintext
shared_buffers = 64144MB
effective_cache_size = 192434MB
maintenance_work_mem = 2047MB
work_mem = 13684kB
timescaledb.max_background_workers = 16
max_worker_processes = 67
max_parallel_workers_per_gather = 24
max_parallel_workers = 48

Recommendations based on 250.57 GB of available memory and 48 CPUs for PostgreSQL 15
wal_buffers = 16MB
min_wal_size = 512MB
default_statistics_target = 100
random_page_cost = 1.1
checkpoint_completion_target = 0.9
max_locks_per_transaction = 512
autovacuum_max_workers = 10
autovacuum_naptime = 10
effective_io_concurrency = 256
```

For benchmarking I set the WAL size:

```plaintext
min_wal_size = 4GB
max_wal_size = 16GB
```

And for the `fsync` off benchmarks I set:

```plaintext
max_wal_size = 32GB
fsync = off
full_page_writes = off
```
