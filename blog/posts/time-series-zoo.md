---
layout: "blog-post"
title: "Touring a mini-zoo of time series and forecasting methods"
date: 2025-09-15
collapsible_headers: true
floating_toc: true
---

[[toc]]


## What are we even doing?

Why look at time series and forecasting methods?
You come across plenty of time series in the natural sciences and in everyday life. You see time series of weather conditions, sunspot numbers, sales figures, and stock prices.
I've always wondered whether you can forecast these time series accurately just by using
It seems like a formal education in time series forecasting is not common, with courses typically being upper-level or grad-level courses in statistics or economics. So I've never had the chance to really learn how to forecast time series. This post is my attempt to teach myself time series forecasting by playing around with a small number of time series and forecasting methods.

Time series forecasting only seems possible if the forecasting method can model or understand the underlying process. When you have clear trends and seasonality it's pretty easy to make forecasts.

For the scope of this post, I'll stick to single/univariate time series and fitting models to single time series. More advanced methods can make forecasts using external predictors. So for a stock price based on how the stock price is moving plus how other stock prices are moving too.

* Scope of this post:
* Explain that forecasting is only possible by capturing the underlying process.
* Explain that we're doing one-shot learning and that some of these may benefit from external predictors.
* Also we want to make some $h$-horizon forecast and act on it.
* Explain that some can be used to make longer-term forecasts (e.g. AR) while some are only good for short-term.

I wanted to learn more about forecasting real-world time series and I thought this kind of material would be easy to find, but I actually found it difficult to find good examples online. Most exampels I found were either focused on time series modeling or the forecasting problem was too simple (simple time series or very short horizon). So I decided to try and pick a bunch of time series and a bunch of modeling methods and to write about my own experience learning to do time series forecasting.

[All models are wrong](https://en.wikipedia.org/wiki/All_models_are_wrong), but some are useful. We'll look at a bunch of time series model and see which are most useful for forecasting and in which cases they are useful.

### Why is this post so long?

### How to navigate this post

## The time series zoo

I collected some interesting and varied time series to play around with and populate the mini-zoo, which I'll describe here. All data is stored in my [`time-series-forecasting`](https://github.com/ali-ramadhan/time-series-forecasting) GitHub repository along with code for turning it into a [`pandas.Series`](https://pandas.pydata.org/docs/reference/api/pandas.Series.html) or [`darts.TimeSeries`](https://unit8co.github.io/darts/generated_api/darts.timeseries.html) and links to where the data was sourced from.

### Keeling Curve

The [Keeling Curve](https://en.wikipedia.org/wiki/Keeling_Curve) represents the CO<sub>2</sub> concentration in the Earth's atmosphere based on continuous measurements taken at the Mauna Loa Observatory on the island of Hawaii since 1958. It's a pretty simple time series with a slowly increasing trend and a pretty regular seasonal cycle with a period of 12 months corresponding to the seasonal cycle.

::: figure centered width-80
![Keeling Curve time series](/assets/images/blog/time-series-zoo/time_series_keeling.png)
:::

CO<sub>2</sub> level increase in the spring and summer as new vegetation growth pulls CO<sub>2</sub> out of the atmosphere through photosynthesis, then decrease in the fall as plants and leaves die off and decay, releasing CO<sub>2</sub> back into the atmosphere. Since Hawaii is quite isolated from sources of pollution and human activity and Mauna Loa is quite high up, the seasonal cycle exhibits little noise or variability, which will make it easier to forecast. In the Southern Hemisphere the cycle is reversed but it is also less pronounced as the Southern Hemisphere has less land and less vegetation as a result.

Measurements were first taken by [Keeling (1960)](#keeling1960) and they're more thoroughly discussed in [Keeling et al. (2005)](#keeling2005).

We'll just look at monthly measurements (from the 15th of each month) but more frequent observations are available.

### Sunspot number

This is the number of [sunspots](https://en.wikipedia.org/wiki/Sunspot) on the Sun's surface. It's the monthly mean total sunspot number since 1749 obtained by taking a simple arithmetic mean of the daily total sunspot number over all days of each calendar month.

::: figure centered width-80
![Sunspots time series](/assets/images/blog/time-series-zoo/time_series_sunspots.png)
:::

Sunspots are cold dark spots on the solar surface caused by concentrations of magnetic flux that inhibit convection. The cyclical behavior is the [solar cycle](https://en.wikipedia.org/wiki/Solar_cycle), a roughly 11-year cycle with significant amplitude variations. Each cycle the sun exhibits increased magnetic activity in the form of sunspots, solar flares, and coronal mass ejections. The period of low sunspot count from roughly 1796 to 1820 correspond to the [Dalton Minimum](https://en.wikipedia.org/wiki/Dalton_Minimum). The exact cause of such minima is not well understood. Predicting future solar cycles may be impossible due to the chaotic nature of the solar surface magnetic field, however short-term predictions of the upcoming solar cycle are possible based on a causal relationship between the Sun's polar field and the toroidal field of the next sunspot cycle [(Nandy, 2021)](#nandy2021). This suggests that we should be forecasting one solar cycle ahead for validation and testing.

### Multivariate ENSO Index

ENSO is the [El Niño-Southern Oscillation](https://en.wikipedia.org/wiki/El_Ni%C3%B1o%E2%80%93Southern_Oscillation). It's a large scale pattern of warm sea surface temperatures in the tropical Pacific Ocean during El Niño, and cold during La Niña, with worldwide effects. It's the strongest [climate oscillation](https://en.wikipedia.org/wiki/Climate_variability_and_change#Oscillations) and the most prominent source of inter-annual variability.

::: figure centered width-80
![mei time series](/assets/images/blog/time-series-zoo/time_series_mei.png)
:::

The Multivariate ENSO Index (MEI) is a method used to characterize the intensity of an ENSO event [(Wolter & Timlin, 2011)](#wolter2011). Like other climate oscillations, ENSO is quasi-periodic with a period of 2-7 years making it difficult to forecast. While Earth's climate is a chaotic system, convolutional neural networks looking at sea surface temperature and oceanic heat content in the Pacific can provide skillful forecasts with a lead time of 1.5 years and older methods can go up to a year [(Ham et al., 2019)](#ham2019). This suggests that we may be able to forecast a year out, but a forecast based solely on the MEI (like what we're doing) might not actually be skillful.

### Durban temperature

This is an hourly time series of surface air temperature near Durban, South Africa from 1940-2023 obtained from the ERA5 climate reanalysis product. It has many more observations than the previous time series so . There are multiple scales of seasonality and variability from the diurnal cycle and day-to-day variability of weather to the seasonal cycle and inter-annual variability, with potentially signals of climate change on top.

::: figure centered width-80
![Durban temperature time series](/assets/images/blog/time-series-zoo/zoom_plot_temperature_Durban.png)
:::

### Global price of wheat

This is the global price of wheat for each month since 1990. The underlying generating process behind this time series is the entire global economy so there's probably no hope of being able to forecast this with any significant lead. But it's worth seeing what the forecasts look like, maybe we can identify some false positives. It might also be worth seeing if we can successfully make short-term forecasts.

::: figure centered width-80
![Wheat time series](/assets/images/blog/time-series-zoo/time_series_wheat.png)
:::

### USD-JPY exchange rate

Daily exchange rate since 2005. Same comments as above.

::: figure centered width-80
![Exchange rate time series](/assets/images/blog/time-series-zoo/time_series_exchange.png)
:::

### LW stock price

This is the stock price of Lamb Weston Holdings, Inc. (ticker symbol: LW) during March 2024 trading hours at a resolution of a few minutes. The above comments on unpredictibility still hold, but what might be interesting here is whether we are able to make forecasts on what the stock price does in the second half of the trading day given we know what it did in the first.

::: figure centered width-80
![Lamb-Weston time series](/assets/images/blog/time-series-zoo/time_series_lamb_weston.png)
:::

### ERCOT electrical load

This is the hourly electrical load in Texas for each control area served by ERCOT (Electric Reliability Council of Texas) between 2004-2023. There are multiple scales of seasonality and variability again with a long-term increasing trend.

::: figure centered width-80
![ERCOT time series](/assets/images/blog/time-series-zoo/time_series_ercot.png)
:::

https://en.wikipedia.org/wiki/January_31_%E2%80%93_February_2,_2023_North_American_ice_storm

### Transformer oil temperature

Electrical load and oil temperature at 15-minute and 1-hour intervals from two electricity transformers in China.

::: figure centered width-80
![Transformer time series](/assets/images/blog/time-series-zoo/time_series_transformer.png)
:::

### Cheese sales

Store-level scanner data of cheese sales at Dominick's Finer Foods, a now-defunct grocery store chain in the Chicago area, from 1989-1994. We will be looking at and forecasting chain-wide weekly cheese sales.

::: figure centered width-80
![Cheese time series](/assets/images/blog/time-series-zoo/time_series_cheese.png)
:::

### Uber pickups

Uber pickups from January to June 2015 in New York City. We'll be looking at and forecasting hourly pickups.

::: figure centered width-80
![Uber time series](/assets/images/blog/time-series-zoo/time_series_uber.png)
:::

## Time series decomposition

<!--
  In this section, show an example of an additive decomposition and another of a multiplicative decomposition? Maybe for the naive decomposition? Or maybe show one additive and one multiplicative?
  Also show the Fourier transform and the correlation between the components?
-->

The idea with decomposing a time series $y_t$ is to write it as $y_t = T_t + S_t + R_t$ where $y_t$ is the data, $T_t$ is the trend-cycle component, $S_t$ is the seasonal component, and $R_t$ is the remainder component (sometimes called the irregular component), all at time $t$. This is called an additive decomposition, but you can also do a multiplicative decomposition where $y_t = T_t \times S_t \times R_t$.[^multiplicative-decomposition]

[^multiplicative-decomposition]: A multiplicative decomposition can describe the data better when the seasonal variations grow proportionally with the trend. So for example, if a sales time series shows that December sales are consistently 50% higher than the trend rather than $500 higher, then a multiplicative decomposition should describe the data better.

Time series decompositions can be useful for understanding the time series and for forcasting. By separating a series into its core components (trend, seasonality, and remainder), we can better understand what's driving changes in the data. For example, a decomposition can help tell us whether sales are growing due an underlying trend or just seasonal spikes, or we can remove seasonal effects to see if there's an underlying trend. For forecasting, decompositions can let us forecast each component separately then recombine them! This can be more effective because the trend component is usually smoother and easier to forecast than the full time series and the seasonal component often has a stable pattern that can be extrpolated. The remainder can be fit separately or even used to provide uncertainty bounds on the forecasts.

The different components should ideally be uncorrelated to suggest that the patterns have been completely separated. Then we can more confidently forecast them separately and recombine the component forecasts into a full forecast for the time series.

### Classical or naive decomposition

In a classical or naive decomposition, the trend component $T_t$ is estimated using some kind of moving average. The trend is then removed by subtracting it (in the additive case) or dividing by it (in the multiplicative case) to get detrended data. Then the seasonal component $S_t$ is estimated by averaging the detrended values for each season so you need to specify a period. What's left after removing $T_t$ and $S_t$ is the remainder component $R_t$.

For example, in the case of statsmodels' `tsa.seasonal.seasonal_decompose`, which we use below, it uses a convolution filter to estimate the trend component $T_t$.

This is a pretty naive approach to decomposition because it assumes the seasonal pattern does not change over time. It's also a bit limited in that the moving average or convolution cannot estimate trends at the beginning and end of the time series.

Let's look at what a classical decomposition looks like for the Keeling curve!

We'll look at the decomposition components as well as the autocorrelation and partial autocorrelation functions for each component which can help tell us which time series model to choose and, when looking at the remainder component $R_t$, whether we've done a good job fitting the data. More concretely, for fitting ARIMA models the ACF helps identify the moving average (MA) order and the PACF helps identify the autoregressive (AR) order. And the ACF and PACF of the residuals should look like white noise.

We'll also also look at a periodogram (or power spectrum) of each component to see which frequencies were captured by each component. The trend component should show power at low frequencies (long-term changes) and the seasonal component should show peaks at specific frequencies, e.g. at the annual frequency (12 months) and its harmonics. The residual component should show uniform power like noise should.

::: figure centered

![Classical seasonal decomposition of the Keeling Curve](/assets/images/blog/time-series-zoo/seasonal_decomposition_keeling_classical.png)

Classical seasonal decomposition of the Keeling Curve. (Left column) Shows the decomposition into trend, seasonal, and residual components. (Middle columns) Shows the autocorrelation (ACF) and partial autocorrelation (PACF) functions for each component. The light blue shading shows the confidence bands for testing whether the correlations are significantly different from zero. (Right column) Shows periodograms for each component on a log scale, highlighting the frequency content.

:::

The components (left column) make sense: an upward trend $T_t$ and a seasonal component $S_t$ showing a regular annual cycles with a relatively stationary remainder component $R_t$, although it's not exactly looking like white noise (it seems to decrease in magnitude then increase again).

The autocorrelation function (ACF) plots (middle-left column) also make sense and provide some insight into how each component behaves.
* The ACF of the time series shows a high autocorrelation even at long lags. This is because even measurements taken many months apart (large lag values) remain highly correlated as they follow the same overall increasing trend. So the ACF of the trend component looks almost the same. As expected, this is a robust signal so it's well above the uncertainty bands. The bands widen at higher lag values because we're working with fewer data points which increases the uncertainty.
* The seasonal component $S_t$ has a more interesting ACF which oscillates annually creating almost perfect autocorrelation at lags of 12, 24, 36, etc. months and almost perfect negative correlation at lags of 6, 18, 30, etc. months. This is just a reflection of the seasonal cycle: measurements are always higher than they were 12 months ago but due to the seasonal cycle they are always lower than they were 6 months ago.
* The residual component $R_t$ should ideally looks like white noise. The values are small and mostly within the confidence bands but you can still see an oscillating signal with values that still exceed the confidence bands suggesting that some patterns have not been captured by the decomposition.

The partial autocorrelation function (PACF) plots also make sense and help identify the direct relationship between an observation and its lag, after removing the effects of shorter lags.
* The PACF at lag $k$ shows the autocorrelation left after accounting for the autocorrelation at lags 1 through $k-1$. So the fact that the PACF of the time series just shows a sharp spike at lag 1 then very small values afterward makes sense because most of the temporal dependence can be explained just by knowing the previous month's value. This is even clearer in the trend component's PACF where every lag beyond 1 is not visible in the plot.
* The PACF of the seasonal component is kinda chaotic, showing numerous large and statistically significant spikes. This complex pattern emerges because a seasonal cycle cannot be fully explained by dependence on just one or two previous values. This is mathematically expected since seasonal patterns essentially represent sine waves (or combinations thereof), which inherently depend on multiple previous values to determine their future trajectory.
* The PACF of the residual component should also ideally look like white noise but once again shows that some patterns have not been captured by the decomposition.

The periodograms (right column) also make sense. Most of the power is in very low frequencies due to the long-term trend of increasing CO2 being the time series' most prominent feature. You can see a couple of peaks: one at 1 cycles per year corresponding to the seasonal cycle, and the other at 2 cycles per year probably corresponding to the different seasonal patterns between the Northern and Southern hemispheres. These peaks are not present in the trend component's periodogram which is a good sign that the seasonal decomposition did something sensible. Due to the naive decomposition, the seasonal component's power is fully contained in a number of pure sine waves which decay in power with increasing frequency. Since the residual component is what's left after subtracting the trend and seasonal components, the residual does not contain any power at the annual frequencies so it's clearly not white noise.

### X13-ARIMA-SEATS

[X13-ARIMA-SEATS](https://www.census.gov/data/software/x13as.html) is a complex seasonal adjustment open-source software package developed by the U.S. Census Bureau. It's the 13th and latest version of a software package used by the Bureau since the 1950's. The first version, Census Method I, was based off the work of [Macaulay (1931)](#macaulay1931) on smoothing time series.[^smoothing]

[^smoothing]: Smoothing is useful to reduce noise in time series and identify trends and seasonality, making it easier to visualize and forecast. Macaulay emphasized the importance of not just relying on a simple moving average, which has a few issues. A simple moving average weighs data points in the averaging window equally when more recent points may be more relevant. Also, it cannot be used at the endpoints. It tends to lag behind the original data. And it can be significantly impacted by outliers. The answer is to use a weighted moving average such as the Henderson moving average.[^henderson]

[^henderson]: The Henderson moving average or filter.

Census Method I was followed by Census Method II and eleven more experimental versions (X1, X2, ..., X11) until Census Method II-X11 [(Shiskin et al., 1967)](#shiskin1967) was good enough to be used widely. But X11 did have a major weakness. X11 produced poor seasonally adjusted data at the end of the time series which made it hard to assess and forecast the direction of short-term trends. At Statistics Canada [Dagum (1978)](#dagum1978) developed X11-ARIMA to combat this weakness by using an appropriate ARIMA model to forecast a bit beyond the end of the time series and backcast a bit before the start, thereby allowing us to use symmetric weighted moving averages over the entire time series. Later [Findley et al. (1998)](#findley1998) developed X12-ARIMA in which the ARIMA model includes regression variables (so it's now called regARIMA) to capture deterministic components such as trading day effects[^trading-day-effects], moving holiday effects, and outliers. Once the deterministic components have been taken out, the time series is said to be <i>linearized</i>[^linearized-confusion].

[^trading-day-effects]: Certain time periods (weeks, months, etc.) have more trading days which can affect economic time series.

[^linearized-confusion]: This is somewhat confusing to me.

X13-ARIMA-SEATS extends X12-ARIMA by using SEATS (Seasonal Extraction in ARIMA Time Series) after the deterministic components have been taken out. SEATS takes the linearized time series and assumes that each component can be modeled as an ARIMA process. Once SEATS has identified an ARIMA model for each component, it uses the Wiener-Kolmogorov (WK) filter to actually estimate the components. The WK filter is designed to give the minimum mean square error (MMSE) estimates of the components. In other words, it tries to make the estimated components as close as possible to the "true" unobserved components. So X13-ARIMA pre-adjusts the time series then SEATS takes the linearized time series and does the decomposition. Another similar method is TRAMO-SEATS.[^tramo-seats]

[^tramo-seats]: TRAMO-SEATS is another method similar to X13-ARIMA-SEATS. TRAMO stands for Time Series Regression with ARIMA Noise, Missing Observations, and Outliers. It was developed at the Bank of Spain and is implemented by the [Demetra+](https://en.wikipedia.org/wiki/Demetra%2B) software package. It similarly accounts for calendar day effects and outliers and also uses SEATS for the decomposition.

In general, methods like X13-ARIMA-SEATS are very detailed and describing them in detail would take up an entire blog post at least. For more of an overview I would refer to [Dagum & Bianconcini (Ch. 4, 2016)](#dagum2016). If you want a much more detailed description of the X11 method see [Ladiray & Quenneville (2001)](#ladiray2001). It's an entire book dedicated to describing the X11 method!

It's probably worth noting that X11 methods are still mainly designed to work with quarterly or monthly time series.

We can apply X13-ARIMA-SEATS to the Keeling Curve and compare the decomposition to the classical one.

::: figure centered

![X13-ARIMA decomposition of the Keeling Curve](/assets/images/blog/time-series-zoo/seasonal_decomposition_keeling_x13_arima_seats.png)

X13-ARIMA-SEATS decomposition of the Keeling Curve.

:::

For X13-ARIMA-SEATS the trend component is very similar to the naive decomposition so there's not much to say there. A key improvement is that the seasonal component's magnitude can now vary in time which allows us to capture whether the seasonal CO2 fluctuations get stronger or weaker. The peaks in the seasonal component's periodogram are wider too and this is more realistic since real-world seasonal patterns have some variability in frequency. As a result, the most dramatic improvement is in the residual component which now looks more like true white noise now. Its ACF and PACF show almost no significant spikes and are almost all within the confidence bands, and its periodogram appears more uniform across frequencies without the dips left by subtracting out the seasonal component.

### Seasonal and Trend decomposition using Loess (STL)

Seasonal and Trend decomposition using LOESS (STL), introduced by [Cleveland et al. (1990)](#cleveland1990), also decomposes a time series into three components: trend, seasonality, and residual. But STL uses a completely different approach from X13-ARIMA-SEATS called LOESS, which relies on local regression to isolate the trend and seasonal components rather than ARIMA models.

LOESS (Locally Estimated Scatterplot Smoothing) is the local regression technique STL uses. It fits a smooth curve to the data by fitting a low-order (usually linear or quadratic) polynomial locally to each data point that gives more weight to nearby points. A traditional weight function is the tri-cube distance function $w(d) = (1 - \|d\|^3)^3$ where $d$ is scaled to be $0 \le d \le 1$. Applying LOESS to the original time series gives an estimate of the trend component. After subtracting the trend from the original time series, LOESS can be applied again to now estimate the seasonal component. Then what's left is the residual component.

X13-ARIMA-SEATS assumes fixed seasonal periods but STL and LOESS can handle different types of seasonality and varying seasonality. Since LOESS is non-parametric it may capture nonlinear patterns better than ARIMA models. But STL can't account for calendar effects like trading days and moving holidays which X13-ARIMA-SEATS handles well.

::: figure centered

![STL decomposition of the Keeling Curve](/assets/images/blog/time-series-zoo/seasonal_decomposition_keeling_stl.png)

STL decomposition of the Keeling Curve.

:::

For STL the trend component is again quite similar. This isn't surprising since the long-term trend in the Keeling Curve is quite strong and easy to identify. The seasonal component is quite similar to X13-ARIMA-SEATS and much better than the classical decomposition, capturing a more natural seasonal pattern and not just pure wine waves. Even though the trend and seasonal components are similar to the X13-ARIMA-SEATS ones, the STL residual component looks more like white noise with fewer outlier spikes even though its periodogram shows a seasonal dip. For the Keeling curve time series we're probably nitpicking though. If you need calendar adjustments then X13-ARIMA-SEATS probably makes more sense. And if you need a more flexible approach without parametric assumptions then STL might work better.

## Stationarity and unit root tests

To properly use some time series models the time series needs to be stationary. This mostly applies to the ARIMA models for this post. A time series is considered to be <i>stationary</i> if its statistical properties (e.g. mean, variance, and autocorrelation) do not change with time.

Formally, a stochastic process $X_t$ is said to be [<i>strictly stationary</i>](https://en.wikipedia.org/wiki/Stationary_process#Strict-sense_stationarity) if its joint distribution of $(X_{t_1}, X_{t_2}, ..., X_{t_n})$ is identical to the joint distribution of $(X_{t_1+\tau}, X_{t_2+\tau}, ..., X_{t_n+\tau})$ for all $n$, all time indices $t_1, t_2, \dots, t_n$ and time lags $\tau$. So all statistical properties of the time series are invariant under time shifts.

The strict definition above is a bit strict for practical purposes, so we can use a weaker definition. A stochastic process is [<i>weak-sense stationary</i>](https://en.wikipedia.org/wiki/Stationary_process#Weak_or_wide-sense_stationarity) if its mean is constant over time, $\mathbb{E}[X_t] = \mathbb{E}[X_{t+\tau}]$, its autocovariance only depends on the time lag, $\operatorname{Cov}[X_t, X_{t+\tau}] = \gamma(\tau)$, and its variance is finite, $\operatorname{Var}[X_t] < \infty$.

In practice, weak-sense stationarity is enough for most time series analyses as many methods mostly rely on the first and second moments which are captured by the mean and autocovariance. But most real-world data is not stationary or close to it, unless transformed. To use ARIMA models for example we need to make the time series stationary. To do so we can difference the time series, a key feature of ARIMA models, and work with $\Delta X_t = X_t - X_{t-1}$. Removing the trend or seasonal patterns may be enough. Looking at $\log X_t$ can also help make the time series more stationary by stabilizing a fluctuating variance.

There are some common statistical tests used to determine whether a time series is stationary or not. Here we'll look at three of them: the Dickey-Fuller test and it's augmented version as well as the Kwiatkowski-Phillips-Schmidt-Shin (KPSS) test.

These tests check for stationarity by testing whether a [<i>unit root</i>](https://en.wikipedia.org/wiki/Unit_root) is present in a time series. Technically in the context of time series, a unit root exists when the characteristic equation of the stochastic process has a root equal to 1. But I think it's more useful to look at a more concrete example to understand the effects of a unit root.

Let's consider an [autoregressive process](https://en.wikipedia.org/wiki/Autoregressive_model) of order 1, denoted AR(1), with a constant term and a linear trend term

$$y_t = \alpha + \beta t + \rho y_{t-1} + \varepsilon_t \label{ar1-process} \tag{1}$$

where $y_t$ is the value at time $t$, $\rho$ is the autoregressive coefficient, $\alpha$ is the constant coefficient, $\beta$ is the linear trend coefficient, and $\varepsilon_t$ is white noise.

If there is no linear trend ($\beta = 0$) then we can say:

* If $\|\rho\| < 1$ then we have a <i>stationary process</i>. The process will tend to revert to its long-run mean of $\alpha / (1 - \rho)$, and shocks have temporary effects that decay over time.
* If $\|\rho\| = 1$ then we have a <i>unit root process</i>. The process does not revert to any fixed mean and shocks have permanent effects on the level of the series.
* If $\|\rho\| > 1$ then we just have an <i>explosive process</i>. The process diverges growing exponentially over time and shocks not only persist but are amplified over time.
* If $\rho < 0$ then the values of $y_t$ will fluctuate between positive and negative values.

So the statistical tests try to check whether $\|\rho\| = 1$ or $\|\rho\| < 1$. Note that the constant coefficient $\alpha$ only leads to a constant value for $y_t$ in the stationary case. Similarly, the linear trend term $\beta t$ only leads to a linear trend in $y_t$ in the stationary case.

You can get $\rho > 1$ processes in the real-world, e.g. financial bubbles and viral spread, but they are temporary, localized phenomena rather than long-term, stable processes. This stuff is super hard to forecast anyways. You can also get negative $\rho$ processes in the real-world, e.g. in some regions wet days may be more likely to be followed by a dry day and vice versa, or stock returns may sometimes oscillate between positive and negative due to mean reversion or overreaction.

### Dickey-Fuller test

The original test was introduced by [Dickey & Fuller (1979)](#dickey1979). It tests the null hypothesis that a unit root is present in an autoregressive process. It considered the AR(1) process from equation \eqref{ar1-process}

$y_t = \alpha + \beta t + \rho y_{t-1} + \varepsilon_t$

which has a unit root if $\rho = 1$. It then considers the first difference

$\Delta y_t = y_t - y_{t-1} = \alpha + \beta t + (1 - \rho) y_{t-1} + \varepsilon_t = \alpha + \beta t + \delta y_{t-1} + \varepsilon_t$

where $\delta = \rho - 1$. So we can test whether $y_t$ is stationary by testing whether $\delta = 0$.

There are three versions of the test depending on whether you want to include the constant term $\alpha$ and/or linear trend $\beta$. You should include the constant term $\alpha$ if the time series fluctuates around a non-zero value. And you should include the linear trend term $\beta t$ if the time series shows a clear linear trend.

Taking this model, the value and standard error of $\delta$ can be estimated using least squares to form the Dickey-Fuller statistic $\textrm{DF}_\delta = \hat{\delta} / \textrm{SE}(\delta)$ which looks like a [$t$-statistic](https://en.wikipedia.org/wiki/T-statistic), but instead of following a [$t$-distribution](https://en.wikipedia.org/wiki/Student%27s_t-distribution) it follows a distribution with no closed form so [Dickey & Fuller (1979)](#dickey1979) tabulate critical values of the Dickey-Fuller statistic. The critical values can be computed using Monte Carlo simulations, although packages like Python's `statsmodels` tend to interpolate the tables for efficiency.

If your time series data exhibits a Dickey-Fuller static below say the 1% critical value, then this is good because if the time series truly has a unit root (following the null hypothesis) then the probability of getting a test statistic this extreme by chance would be less than 1%. But we can't actually quantify the probability that the time series is truly stationary using this statistic.

<figure class="centered width-80" markdown="block">

![Dickey-Fuller test statistic distribution under the null hypothesis](/assets/images/blog/time-series-zoo/dickey_fuller_null_hypothesis_distribution.png)

Dickey-Fuller test statistic distribution under the null hypothesis for the case of no constant term ($\alpha = 0$) and no linear trend ($\beta = 0$). The distribution was estimated using Monte Carlo sampling with 100,000 AR(1) simulations, each consisting of 2,000 data points. The critical values agree closely with table 2 ($\tau_c$ and $N=1$ rows) of MacKinnon (2010).

:::

To generate a sample from the Dicker-Fuller null distribution (and create the figure above), we generate a long random walk $y_t = t_{t-1} + \varepsilon_t$ where $\varepsilon_t \sim \mathcal{N}(0, 1)$. This is equation \eqref{ar1-process} but with $\rho = 1$ and $c = 0$ so it has a unit root. We can then set up a regression problem, $\Delta y_t = \delta y_{t-1} + c + \varepsilon_t$, and use ordinary least squares to estimate the parameters $\delta$ and $c$ along with their variance and standard error. The Dickey-Fuller statistic is then computed as $\hat{\delta} / \operatorname{SE}(\hat{\delta})$ where $\hat{\delta}$ is the least squares estimate of $\delta$, and $\operatorname{SE}(\hat{\delta})$ is the <i>standard error</i> of $\hat{\delta}$.

Although useful, the Dickey-Fuller test has some major limitations. It's based on a simple AR(1) model which may not capture the complex dynamics present in many time series. It also assumes the error terms in the model are uncorrelated which is not true of many real-world time series. The Augmented Dickey–Fuller (ADF) test was developed to address these limitations.

### Augmented Dickey-Fuller test

The testing procedure is the same as for the Dickey–Fuller test but we instead use a more flexible autoregressive process of order $p$, denoted $\operatorname{AR}(p)$, again with constant and linear trend terms

$y_t = \alpha + \beta t + \rho_1 y_{t-1} + \rho_2 y_{t-2} + \cdots + \rho_p y_{t-p} + \varepsilon_t $

where we now have $p$ autoregressive coefficients $\rho_1, $\rho_2, \dots, \rho_p$. Now the first difference is

$\Delta y_t = \alpha + \beta t + (\rho_1 - 1) y_{t-1} + \rho_2 y_{t-2} + \cdots + \rho_p y_{t-p} + \varepsilon_t$

which we can rearrange in terms of the lagged differences (see footnote or appendix?) as

$\Delta y_t = \alpha + \beta t + \gamma y_{t-1} + \delta_1 \Delta y_{t-1} + \delta_2 \Delta y_{t-2} + \cdots + \delta_{p-1} \Delta y_{t-p+1} + \varepsilon_t$

We want to regress on differences $\Delta y_{t-i}$ instead of time series values $y_{t-i}$ because under the null hypothesis a unit root is present so the differences are all stationary (explain why, maybe in a footnote?), but not the time series values. We are interested in estimating the value of $\gamma$ here, so ideally all other regressors should be stationary. <!-- Explain more... -->

The number of lags $p$ can be chosen using information criteria like AIC or BIC, or more simply by including enough lags until the residuals appear uncorrelated.

Just as with the original Dickey-Fuller test, we're testing whether $\gamma = 0$ (which corresponds to $\rho_1 = 1$?, indicating a unit root) against the alternative that $\gamma < 0$ (corresponding to $\rho_1 < 1$?, indicating stationarity). The test statistic is computed similarly as $\hat{\gamma} / \operatorname{SE}(\hat{\gamma})$, where the estimates come from fitting the augmented model using ordinary least squares.

The null distributions of the Augmented Dickey-Fuller (ADF) and original Dickey-Fuller (DF) tests are actually the same for all $p$! So no need to compute new critical values. Under the null hypothesis of a unit root, the $y_{t-1}$ term is an integrated process while the lagged differences $\Delta y_{t-i}$ are stationary. As the sample size grows, the non-stationary $y_{t-1}$ dominates the asymptotic distribution of the test statistic, while the stationary differences become negligible. This is why both the simple and augmented Dickey-Fuller tests share the same limiting distribution and critical values.

One subtlety worth noting is that the ADF test, like its simpler predecessor, has low power when $\rho$ is close to but less than 1. This means it might fail to reject the null hypothesis of a unit root even when the series is actually stationary. This is one reason why it's often useful to complement the ADF test with other stationarity tests, such as the KPSS test, which we'll explore next.

### Kwiatkowski–Phillips–Schmidt–Shin (KPSS) test

The KPSS test, developed by [Kwiatkowski et al. (1992)](#kwiatkowski1992), takes a different approach to testing for stationarity. It considers the model

$y_t = \alpha + \beta t + r_t + \epsilon_t$

where $r_t = r_{t-1} + u_t$ is a random walk, $u_t \sim iid(0, \sigma_u^2)$, and $\epsilon_t$ is a stationary error process. The null hypothesis this time is that $\sigma_u^2 = 0$, i.e. that $y_t$ is trend-stationary. So the alternative, that $\sigma_u^2 > 0$, is that $y_t$ is not stationary.

You can compute residuals $\hat{e}_t$ by regressing on $y_t = \alpha + \beta t + \hat{e}_t$. Under the null hypothesis, the residuals $\hat{e}_t$ would be stationary. Under the alternative hypothesis, the residuals would contain both $r_t$ and $\epsilon_t$ are not be stationary.

We can now compute the partial sums of the residuals,

$\displaystyle S_t = \sum_{i=1}^t \hat{e}_i$

and under the null hypothesis $S_t$ are partial sums of a stationary process and thus stationary themselves. But under the alternative hypothesis the partial sums $S_t$ show much more variation due to the inclusion of the random walk $r_t$.

So this motivates the KPSS test statistic

$\displaystyle \eta = \frac{1}{\hat{\sigma}^2 T^2} \sum_{t=1}^T S_t^2$

where $T$ is the sample size (length of the time series) and $\hat{\sigma}^2$ is the long-run variance estimator.

$\hat{\sigma}_\infty^2$ is an estimate of the long-run variance of the residuals which captures the total impact of a shock over time, accounting for both immediate effects and lingering effects in subsequent periods. Unlike the simple variance, which only considers contemporaneous relationships, the long-run variance incorporates autocovariances at various lags. This is particularly important in time series data where observations are often correlated over time. A common way to estimate the long-run variance is using a heteroskedasticity and autocorrelation consistent (HAC) estimator, typically the Newey-West estimator. This approach accounts for potential autocorrelation in the residuals.

The test statistic examines how much the cumulative sum of the residuals fluctuates. If the fluctuations are small, $\eta$ is small and the time series is more likely to be stationary. If the fluctuations are large, $\eta$ is large and the time series is more likely to contain a unit root. If $\eta$ is larger than some critical value we can reject the null hypothesis.

<figure class="centered width-80" markdown="block">

![KPSS test statistic distribution under the null hypothesis](/assets/images/blog/time-series-zoo/kpss_no_trend_null_hypothesis_distribution.png)


  KPSS test statistic distribution under the null hypothesis assuming no trend. The distribution was estimated using Monte Carlo sampling with 100,000 simulations, each consisting of 2,000 data points. The critical values agree with Table 1 of <a href="#kwiatkowski1992">Kwiatkowski et al. (1992)</a>. Code to produce this figure (and corresponding figure with trend) can be found in <a href="https://github.com/ali-ramadhan/time-series-forecasting/blob/main/kpss_distribution.ipynb"><code>kpss_distribution.ipynb</code></a>


:::

The KPSS test relies on several key assumptions:

1. Under the null hypothesis, the series is assumed to be stationary or trend-stationary.
2. Under the alternative hypothesis, the series is assumed to have a unit root.
3. The error terms $e_t$ are assumed to be stationary and weakly dependent.
4. The test assumes that any non-stationarity in the series can be adequately captured by a deterministic trend and/or a random walk component.

It's important to note that the KPSS test, like many statistical tests, is based on asymptotic theory. This means its properties are guaranteed as the sample size approaches infinity. In finite samples, especially small ones, the test's performance may deviate from its theoretical properties.

Furthermore, the test's power (ability to correctly reject the null when it's false) can be affected by the presence of structural breaks or other forms of non-linearity in the data. Therefore, it's always advisable to combine the KPSS test with visual inspection of the data and other complementary tests for a comprehensive analysis of stationarity.

The KPSS test is often used in conjunction with other tests like the ADF test to make more robust conclusions about stationarity.

<!-- Let's do this in the proper sections!
## Analyzing each time series

* Look at trend-cycle decompositions and stationarity for each time series.
* We're looking for something stationary to predict in each? Depends on the method I guess.
-->

## Traditional forecasting methods

Explain that we're splitting into train, val, and test. Must be in chronological order.

We'll look at the MAE.

When possible we'll make probabilistic forecasts and look at the MIW and MIC.

### Exponential smoothing (Holt-Winters')

#### Description

Exponential smoothing is a pretty simple method to produce forecasts using weighted averages of past observations, with the weights decaying exponentially as the observations get older. So more recent data points get larger weights. Holt-Winters' method builds on this by explicitly modeling trend and seasonality. <a href="#hyndman2021">Hyndman & Athanasopoulos (Ch. 8, 2021)</a> have a really nice introduction to exponential smoothing methods including Holt-Winters' method, so we'll just describe the model.

There are two main variations of Holt-Winters' method, depending on how seasonality is incorporated: additive or multiplicative.

#### Additive method

The additive method is generally used when the seasonal variations are roughly constant throughout the series, for example if sales consistently increase by 100 units in December whether sales are high or low. Let $y_t$ be the time series observation at time $t$ and $\hat{y}_{t+h\|t}$ be the forecast at time $t+h$ given the observation up to time $t$. The method involves three smoothing equations for the level $\ell_t$, trend $b_t$, and seasonal components $s_t$, plus the forecast equation:

$$
\begin{aligned}
  \hat{y}_{t+h|t} &= \ell_t + h b_t + s_{t+h-m(k+1)} \quad& (\mathrm{forecast}) \\
  \ell_t &= \alpha(y_t - s_{t-m}) + (1-\alpha)(\ell_{t-1} + b_{t-1}) \quad& (\mathrm{level}) \\
  b_t &= \beta(\ell_t - \ell_{t-1}) + (1-\beta)b_{t-1} \quad& (\mathrm{trend}) \\
  s_t &= \gamma(y_t - \ell_{t-1} - b_{t-1}) + (1-\gamma)s_{t-m} \quad& (\mathrm{seasonal})
\end{aligned}
$$

Here $m$ is the number of periods in a season (e.g. 12 for monthly data and 4 for quarterly data). The model maintains $m$ distinct seasonal components $s_1, s_2, \ldots, s_m$, where each $s_i$ represents the seasonal effect for the $i$-th period within the seasonal cycle. The parameter $k = \lfloor (h - 1) / m \rfloor$ ensures that when forecasting $h$ steps ahead, we cycle through the seasonal components correctly. $\lfloor x \rfloor$ is the floor function. $\alpha$, $\beta$, and $\gamma$ (all between 0 and 1) are smoothing parameters for the level, trend, and seasonal components respectively that control how quickly the model adapts to new data.

So to produce a forecast, you take the level $\ell_t$, linearly extrapolate the trend $b_t$ by the number of time periods $h$, and add the seasonal component for time period $t+h$, which is $s_{t+h-m(k+1)}$.
* The level $\ell_t$ is a weighted average of $y_t - s_{t-m}$ which is the current observation with seasonality removed and $\ell_{t-1} + b_{t-1}$ which is what we would expect the level to be if it followed the previous level and trend.
* The slope $b_t$ is a weighted average of $\ell_t - \ell_{t-1}$ which is the most recent change in level and $b_{t-1}$ which is the previous trend.
* The seasonal correction $s_t$ is a weighted average of $y_t - \ell_{t-1} - b_{t-1}$ which is an estimate of the seasonal component in the current observation (what's left after accounting for the previous level and trend) and $s_{t-m}$ which is the estimate from the previous season.

#### Multiplicative method

The multiplicative method is better when the seasonal variations are proportional to the level of the series. For example, if sales in December are consistently 20% higher than the average, whether overall sales are high or low.

$$
\begin{aligned}
  \hat{y}_{t+h|t} &= (\ell_t + h b_t) s_{t+h-m(k+1)} \quad& (\mathrm{forecast}) \\
  \ell_t &= \alpha \frac{y_t}{s_{t-m}} + (1-\alpha)(\ell_{t-1} + b_{t-1}) \quad& (\mathrm{level}) \\
  b_t &= \beta(\ell_t - \ell_{t-1}) + (1-\beta)b_{t-1} \quad& (\mathrm{trend}) \\
  s_t &= \gamma \frac{y_t}{(\ell_{t-1} + b_{t-1})} + (1-\gamma)s_{t-m} \quad& (\mathrm{seasonal})
\end{aligned}
$$

We can interpret the weighing similarly to how we did with the additive case except now we multiply or divide by the seasonal component instead of add or subtract.

#### Damping

Sometimes, a simple linear trend $b_t$ can extrapolate a bit too enthusiastically into the future, leading to forecasts that shoot off. To tame this, we can introduce a *damping parameter* $\phi$ (usually between 0 and 1, often close to 1). Damping causes the trend to flatten out over longer forecast horizons. Damping can be applied to both additive and multiplicative Holt-Winters' methods. For example, adding a damped trend to the additive method we get:

$$
\begin{aligned}
  \hat{y}_{t+h|t} &= \ell_t + (\phi + \phi^2 + \dots + \phi^h)b_t + s_{t+h-m(k+1)} \quad& (\mathrm{forecast}) \\
  \ell_t &= \alpha(y_t - s_{t-m}) + (1-\alpha)(\ell_{t-1} + \phi b_{t-1}) \quad& (\mathrm{level}) \\
  b_t &= \beta(\ell_t - \ell_{t-1}) + (1-\beta)\phi b_{t-1} \quad& (\mathrm{trend}) \\
  s_t &= \gamma (y_t - (\ell_{t-1} + \phi b_{t-1})) + (1-\gamma)s_{t-m} \quad& (\mathrm{seasonal})
\end{aligned}
$$

The trend's contribution to the forecast is now damped: instead of multiplying by $h$ we multiply by $\phi + \phi^2 + \dots + \phi^h$ which is less than $h$ if $0 \le \phi \le 1$ preventing the forecast from shooting off, especially for large $h$. Otherwise, when the trend $b_t$ is used it is now multiplied by $\phi$.

#### Training

Via darts, we use the statsmodels exponential smoothing implementation to fit to time series data. To estimate $\alpha$, $\beta$, $\gamma$, and $\phi$, an optimization method is used. By default, statsmodels uses SLSQP.[^slsqp] To start the exponential smoothing process, we need initial values for the level $\ell_0$, trend $b_0$, and seasonal components $s_1, s_2, \ldots, s_m$. Simple approaches include setting $\ell_0 = y_1$ (the first observation), $b_0 = (y_{m+1} - y_1)/m$ for seasonal data, and estimating seasonal components by averaging each season's deviations from the overall mean. More sophisticated methods use optimization to find initial values that minimize forecast errors, or apply classical decomposition to the first few seasonal cycles. The choice of initialization can significantly impact early forecasts, though its influence diminishes as more data is processed.

Hyperparameter optimization on the trend and seasonality type, Box-Cox parameter, etc.

Query code for how initialization and prediction intervals are done.

[^slsqp]: SLSQP (Sequential Least SQuares Programming) is an iterative optimization algorithm designed to solve nonlinear programming problems with both equality and inequality constraints. It's suitable for estimating exponential smoothing parameters ($\alpha, \beta, \gamma$) because these parameters often have bounds (e.g., between 0 and 1), and the optimization problem (e.g., minimizing mean squared error or maximizing likelihood) is generally nonlinear. SLSQP finds the parameter values that best fit the model to the observed time series data, given these constraints.

#### Keeling Curve

Exponential smoothing does quite well on the Keeling Curve, which isn't too surprising given the nature of the data. The Keeling Curve exhibits a clear upward trend with regular seasonal oscillations, so it's easy to forecast. Here's the best model based on the Mean Absolute Percentage Error (MAPE) error metric:

::: figure centered

![exponential smoothing best model keeling](/assets/images/blog/time-series-zoo/exponential_smoothing_best_model_keeling.png)

The best fitting exponential smoothing model for the Keeling Curve.

:::

We can see it uses additive trend and additive seasonality components without damping. This makes sense physically: CO2 concentration increases at a fairly steady rate (additive trend) and has seasonal variations that don't dramatically change in amplitude over time (additive seasonality). The trend seems robust so no need for damping.

Looking at the smoothing parameters, $\alpha = 0.5909$ indicates that the model gives substantial weight to recent observations when updating the level component. $\beta = 0.0115$ is pretty small because the trend is changing pretty slowly but steadily. $\gamma = 0.1131$ is a moderate value and allows the seasonal pattern to adapt gradually as it is robust but with some slight interannual variations.

Looking at the MAPE the fit is pretty good. It extrapolates well, even multiple years into the future, and based on the fit to the testing data, the model has not overfit. $m = 12$ seasonal periods makes a lot of sense too. The only thing that might be missing is that the model underestimates the growth of the trend term, perhaps because CO2 increase is accelerating. But the real time series is well contained within the model's prediction interval.

If the trend is accelerating, then training only on more recent observation might produce better forecasts.

::: figure centered

<video class="full-width-video" controls>
  <source src="/assets/images/blog/time-series-zoo/exponential_smoothing_models_keeling.mp4" type="video/mp4">
</video>

Comparison of different exponential smoothing models for the Keeling Curve, shown in order from worst to best performing configurations based on validation error.

:::

The vast majority of models are not good fits, mostly because $m = 12$ seasonal periods (or a multiple of 12) fits the data best. This is why hyperparameter optimization is important here.

#### Sunspots

Fitting exponential smoothing models to the monthly sunspot number time series requires a bit of pre-processing because the time series must always be non-negative (we cannot have a negative number/count of sunspots). So enforce this, we transform the time series using the Box-Cox transformation[^box-cox] then fit the exponential smoothing model to the transformed time series. We forecast the transformed time series and undo the transformation to plot forecasts and simulations alongside the oreiginal time series. The Box-Cox parameter $\lambda$ can be chosen as part of hyperparameter optimization.

[^box-cox]: The Box-Cox transformation is a family of power transformations used to stabilize variance and make data more approximately normal. We can also use it to  The forward transformation is

    $$y^{(\lambda)} = \begin{cases} \frac{y^\lambda - 1}{\lambda} & \text{if } \lambda \neq 0 \\ \ln(y) & \text{if } \lambda = 0 \end{cases}$$

    where $\lambda$ is estimated from the data (in our case $\lambda = 0.30$). The inverse transformation to get back to the original scale is

    $$y = \begin{cases} (\lambda y^{(\lambda)} + 1)^{1/\lambda} & \text{if } \lambda \neq 0 \\ \exp(y^{(\lambda)}) & \text{if } \lambda = 0 \end{cases}$$

    Values of $\lambda = 1$ leave data unchanged, $\lambda = 0.5$ corresponds to a square root transformation, and $\lambda = 0$ gives a log transformation.

The time series also has a quasi-periodic cycle averaging around 11 years so we'll need around 132 seasonal periods (11 years x 12 months) which is quite a lot of parameters for exponential smoothing. So instead, for exponential smoothing we'll look at the yearly mean sunspot number reducing the required number of seasonal periods to just 11.

::: figure centered

![exponential smoothing best model sunspots](/assets/images/blog/time-series-zoo/exponential_smoothing_best_model_sunspots.png)

The best fitting exponential smoothing model for the yearly-mean sunspot number time series.

:::

$\alpha = 0.9688$ is close to 1 so the model gives almost all weight to most recent observations. $\beta = 7.3202 \times 10^{-9}$ makes sense as there's no trend in the sunspot time series. And $\gamma = 2.2994 \times 10^{-8}$ is tiny which is saying that the seasonal components are barely being updated from their initial values and that the model is basically using a fixed seasonal pattern.

While the model captures the general ~11-year periodicity in the validation period, it completely fails to predict the amplitude of future cycles. In the test period, it even struggles with timing prediction. This isn't surprising—the solar cycle is driven by complex magnetohydrodynamic processes that can't be adequately captured by simple statistical models. Each cycle is somewhat unique and influenced by deep physical processes within the Sun that create significant variations from one cycle to the next.

The most striking feature compared to our Keeling Curve forecasts is the enormous prediction intervals. These wide intervals reflect the model's genuine uncertainty about future sunspot activity. Since the fit to historical data isn't particularly good, the error term has large variance, and this uncertainty compounds dramatically as we forecast further into the future. By the end of the test period, the prediction interval spans nearly the entire historical range of observed values—essentially acknowledging that beyond a few years, the model has little confidence in its point predictions.

You might notice we only used additive models for the sunspot series rather than exploring multiplicative variants. This is deliberate—multiplicative models are problematic for sunspot data for two key reasons. First, the sunspot series contains zeros (particularly during solar minima), and multiplicative models break down with zero values since they involve division operations in their update equations. Second, the variation in sunspot amplitude doesn't consistently scale with the level in a proportional way that multiplicative models assume. Solar cycles with higher peaks don't necessarily have proportionally higher values throughout the entire cycle. The Box-Cox transformation (λ = 0.30) we applied already handles some of the non-linear scaling relationships in the data, making the additive model on transformed data more appropriate than a multiplicative approach on the original series.

This example highlights a fundamental limitation of exponential smoothing: it works well for time series with stable patterns but struggles with complex, variable cycles that aren't strictly periodic. More sophisticated approaches are needed for meaningful sunspot predictions, ideally incorporating physical models of solar dynamics rather than relying solely on statistical patterns in historical data.

::: figure centered

<video class="full-width-video" controls>
  <source src="/assets/images/blog/time-series-zoo/exponential_smoothing_models_sunspots.mp4" type="video/mp4">
</video>

Comparison of different exponential smoothing configurations for sunspot prediction, ordered from worst to best performing models based on validation error. Note how different combinations of trend and seasonal components affect forecast quality.

:::

<!-- Mention AutoETS: https://nixtlaverse.nixtla.io/statsforecast/src/core/models.html#autoets -->

<!-- No point trying on MEI or any of the financial time series? -->

### Autoregressive

Autoregressive models represent one of the most fundamental approaches to time series modeling. The basic idea is remarkably intuitive: predict the current value based on past values of the series. Formally, an autoregressive model of order $p$, denoted as AR($p$), expresses the current observation as a linear combination of $p$ previous observations plus a random error term:

$$y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + \ldots + \phi_p y_{t-p} + \varepsilon_t$$

Here, $c$ is a constant term, $\phi_1, \phi_2, \ldots, \phi_p$ are the autoregressive coefficients, and $\varepsilon_t$ is white noise with mean zero and constant variance $\sigma^2$. The order $p$ determines how many past values influence the current value, essentially representing the "memory" of the process.

For an AR model to be stationary (meaning its statistical properties don't change over time), the autoregressive coefficients must satisfy certain mathematical constraints. For an AR(1) model, stationarity requires $\|\phi_1\| < 1$. For higher-order models, the constraints become more complex, but essentially require that the roots of the characteristic polynomial lie outside the unit circle.

Unlike the exponential smoothing methods we explored earlier, autoregressive models don't explicitly model trend or seasonality components. Instead, they capture these patterns implicitly through the lag structure. For example, in monthly data with annual seasonality, we might see significant coefficients at lags 12, 24, and 36, reflecting the seasonal pattern. This approach can be more flexible than the structured decomposition used in exponential smoothing, but it also means we need to carefully select the appropriate lag order.

Parameter estimation for AR models typically uses either ordinary least squares or maximum likelihood estimation. The optimal lag order $p$ can be determined using information criteria like AIC or BIC, which balance model fit against complexity. Alternatively, we might examine the partial autocorrelation function (PACF), which shows the correlation between $y_t$ and $y_{t-k}$ after removing the effects of the intermediate lags. Significant spikes in the PACF suggest which lags should be included in the model.

A key strength of autoregressive models is their interpretability—each coefficient directly shows how strongly a particular lag influences the current value. However, pure AR models have limitations. They struggle with strong trends since they don't explicitly model them, and they can have difficulty capturing long seasonal patterns efficiently. These limitations are often addressed by extending to more complex models like ARIMA (Autoregressive Integrated Moving Average) or SARIMA (Seasonal ARIMA), which we'll explore in later sections.

Let's see how autoregressive models perform on our time series, starting with the Keeling Curve:

::: figure centered

![Autoregressive best model Keeling](/assets/images/blog/time-series-zoo/autoregressive_best_model_keeling.png)

Autoregressive best model Keeling Curve.

:::

::: figure centered

<video class="full-width-video" controls>
  <source src="/assets/images/blog/time-series-zoo/autoregressive_models_keeling.mp4" type="video/mp4">
</video>

Autoregressive models for the Keeling Curve.

:::

The performance of autoregressive models on the Keeling Curve offers fascinating insights into both the model's capabilities and the nature of the CO2 data itself. Looking at our best-performing model, we see an AR(24) model with second-order differencing (d=2) achieves impressive accuracy with MAPE values of 0.55% on the validation set and an even better 0.41% on the test set.

The high-order AR model (p=24) is particularly interesting here. While we might expect that 12 lags would be sufficient to capture the annual cycle in monthly data, the model benefits from incorporating two full years of lagged values. This suggests that CO2 concentrations don't just depend on the same month from the previous year, but potentially exhibit longer-term dependencies that span multiple years. This aligns with our understanding of the carbon cycle, where CO2 exchanges between the atmosphere, biosphere, and oceans operate on varying timescales.

The second-order differencing (d=2) is crucial for the model's success. As shown in the bottom-left panel of the second figure, models with d=2 substantially outperform those with other differencing levels across almost all autoregressive orders. First-order differencing (d=1) helps remove the strong upward trend in the Keeling Curve, but second-order differencing appears necessary to properly stabilize the series for autoregressive modeling. This suggests that the CO2 increase is not just linear but has acceleration components that need to be accounted for.

The bottom right panel showing the coefficient values for a poorer-performing model (AR(20) with d=3) reveals why over-differencing is problematic. The extreme negative values in the middle coefficients create an unstable model that quickly diverges from reality, producing the dramatically wrong downward forecasts seen in the top panel. This highlights how sensitive autoregressive models can be to their parameterization—with the right settings, they produce remarkably accurate forecasts, but with sub-optimal parameters, they can fail catastrophically.

The prediction intervals for our best AR model start relatively narrow but widen as the forecast extends further into the future, which correctly represents the growing uncertainty. However, they remain sufficiently tight even at extended horizons to be useful for climate projections. This suggests that despite the apparent complexity of atmospheric CO2 dynamics, there's a strong statistical regularity that AR models can capture effectively.

Compared to the exponential smoothing approach we discussed earlier, the autoregressive model achieves similar accuracy (MAPE of 0.41% for AR versus 0.50% for exponential smoothing on the test set). This comparable performance from two conceptually different approaches reinforces our confidence in the forecasts—when distinct modeling philosophies arrive at similar projections, it suggests we're genuinely capturing the underlying process rather than just fitting to patterns that might be artifacts of a particular model structure.

What's particularly notable is that the AR model accomplishes this without explicitly modeling trend and seasonality components. Instead, it implicitly captures these patterns through its lag structure and differencing. This more flexible approach might be better equipped to adapt to subtle changes in the CO2 trend or seasonal pattern over time, which could explain its slightly superior performance on the test set.

#### Sunspots

Next, let's examine how autoregressive models handle the more challenging sunspot time series:

::: figure centered

![Autoregressive best model sunspots](/assets/images/blog/time-series-zoo/autoregressive_best_model_sunspots.png)

Autoregressive best model for sunspot number prediction.

:::

::: figure centered

<video class="full-width-video" controls>
  <source src="/assets/images/blog/time-series-zoo/autoregressive_models_sunspots.mp4" type="video/mp4">
</video>

Comparison of different autoregressive configurations for sunspot prediction.

:::

The sunspot data presents a fascinating challenge for autoregressive models. The first figure shows our best-performing model: an AR(11) with second-order differencing (d=2) and a Box-Cox transformation (λ=0.60). This model manages to capture the cyclic nature of solar activity with remarkably good timing, albeit with some limitations in amplitude prediction. The model achieves a Mean Absolute Error (MAE) of 47.95 for the validation period and 28.15 for the test period. Note that we're using MAE rather than MAPE here since the sunspot count frequently approaches zero, which would make percentage errors misleadingly large.

The second figure provides a more comprehensive view of model performance, showing both a poorer-performing model (AR(34) with d=3) and diagnostic plots. The top panel reveals how this model dramatically overestimates sunspot counts in the test period (MAE of 132.98), producing unrealistic peaks despite reasonable performance in the validation period. The bottom-left panel shows how error varies with autoregressive order (p) across different differencing levels, while the bottom-right panel displays the coefficient pattern for the AR(34) model—note the extremely large positive coefficient at lag 34 (around +50), suggesting a serious overfitting issue.

Applying autoregressive models to sunspot data reveals both successes and limitations of this approach for complex natural phenomena. The optimal model (AR(11) with d=2) demonstrates remarkable skill in capturing the quasi-periodic solar cycle, with forecasts that maintain the approximately 11-year periodicity seen throughout the historical record. The model's ability to time the peaks and troughs reasonably well is particularly impressive given the known variability in cycle length, which can range from 9 to 14 years.

The Box-Cox transformation (λ=0.60) plays a crucial role in this model's success. This transformation helps stabilize variance across the series, addressing the fact that higher sunspot counts tend to show greater variability. A λ value of 0.60 represents a transformation between a square root (λ=0.5) and the original data (λ=1.0), effectively reducing the influence of extreme peaks without completely flattening them.

The choice of p=11 for our best model intuitively aligns with the average solar cycle length. This suggests the model is directly capturing the fundamental periodicity rather than relying on higher-order patterns. Second-order differencing (d=2) helps stabilize the series, removing both level shifts and changes in trend that might occur between different solar cycles.

The prediction intervals for the sunspot forecasts are notably wider than those we saw for the Keeling Curve, reflecting the greater inherent uncertainty in solar activity prediction. This aligns with current scientific understanding of solar dynamics, where the complex magnetohydrodynamic processes driving sunspot formation have chaotic elements that fundamentally limit predictability.

Comparing the two figures reveals important insights about model selection. The AR(34) model with d=3 demonstrates classic overfitting symptoms: it performs reasonably on the validation set (though still worse than our optimal model) but fails catastrophically on the test set. Looking at the coefficient plot, the extreme positive value at lag 34 suggests the model is placing enormous emphasis on patterns that happened exactly 34 years ago—essentially "memorizing" the training data rather than learning generalizable patterns. This is further exacerbated by over-differencing (d=3), which introduces additional instability.

The MAE comparison chart is particularly revealing. While d=2 still performs best overall, the differences between differencing levels are much less pronounced than with the Keeling Curve data. The lines for d=0, d=1, and d=2 remain relatively close across most autoregressive orders, with only d=3 showing dramatic error spikes at certain values of p. This suggests that the sunspot data is inherently more stationary than the CO2 data, requiring less aggressive differencing to achieve reasonable performance.

One notable limitation is that while our best model captures cycle timing well, it struggles somewhat with amplitude prediction. This is a common challenge with sunspot forecasting—even sophisticated physical models have difficulty predicting how strong or weak a particular solar cycle will be. The relatively flat peaks in our forecasts suggest the model is essentially predicting "average" cycle amplitudes rather than the extreme variations that can occur in reality.

Compared to our exponential smoothing results from earlier, the autoregressive approach performs better for this particular dataset. While both methods struggle with the inherent unpredictability of solar activity, the AR model's ability to directly incorporate the ~11-year periodicity through its lag structure gives it an advantage over the more rigid seasonal patterns in exponential smoothing. This highlights the importance of matching the modeling approach to the specific characteristics of the time series being analyzed.

### ARIMA

### TBATS

### Prophet

### Gradient boosting forecasting

### Neural network forecasting

### Foundational model forecasting

## What else can we do?

* Covariates.
* Multiple time series.

## Appendices

### General resources

online textbook, python book?, python packages?

Explain packages: pandas, darts, statsmodels, statsforecast, sktime

### Statistical hypothesis testing

We use some hypothesis tests in this post and I was a little rusty on the details. So this appendix is just a brief aside on hypothesis tests and things to be careful of when using them. I also give an overview of a few popular tests even though we don't use them in this post. I include some formulas for computing critical values as I could not easily find the information online.

A statistical hypothesis test aims to infer something about a population (e.g. a mean, proportion, or variance) based on sample data. You set up a null hypothesis $H_0$ and an alternative hypothesis $H_1$, then conduct a test based on the sample data and decide whether you are able to reject the null hypothesis $H_0$ with some confidence level. Usually the null hypothesis states that there is no difference or no relationship but it can take various forms, while the alternative hypothesis $H_1$ usually claims the opposite. To decide whether we can reject $H_0$, we compute a <i>test statistic</i> from the sample data and null hypothesis. The test statistic may follow some known probability distribution (under certain assumptions) and based on how extreme the test statistic is, we may be able to reject $H_0$. The <i>p-value</i> is the probability of observing a test statistic as extreme under the null hypothesis. You choose the threshold for rejecting $H_0$ at a specific significance level, often denoted as $\alpha$, based on your desired false-positive rate. So a low p-value (say 0.001) means you can reject the null hypothesis with a lot of confidence.

You generally need to be careful when using hypothesis tests though. The tests often assume the data is e.g. normal or independent, so you gotta make sure that any assumptions made by the test apply to your sample data. You also need enough sample data, otherwise it's easy to end up with false negatives. And just because the p-value is high, it does not mean that the null hypothesis is correct. It just suggests a lack of evidence against it. So hypothesis tests and p-values are useful tools, not ends in themselves. They provide a piece of evidence in the pursuit of answering a research question. A test can tell you whether something is statistically significant, but it can't determine whether that something is meaningful or important.

It's worth noting that p-values are frequently misused in research. If you're looking to make a claim based on a low-enough p-value you can analyze data in different ways until you find one where p < 0.05 (a common threshold). This is called [p-hacking](https://en.wikipedia.org/wiki/Data_dredging) and may involve just changing the sample size. So maybe we should use a more stringent thresholds of 0.01 or even 0.001. But you should always report the exact p-value alongside effect sizes rather than just stating that the effect is "statistically significant"™.

#### $t$-test

A commonly used hypothesis test is the [$t$-test](https://en.wikipedia.org/wiki/Student%27s_t-test) [(Student, 1908)](#student1908), developed by William Sealy Gosset while working as a chemist at the Guinness brewery in Dublin. Gosset published under the pseudonym "Student" because apparently Guinness preferred it if research staff published under pen names, perhaps to avoid accidently leaking trade secrets and because they did not want competitors to know that they were using $t$-tests to determine the quality of barley. So now it's also known as "Student's $t$-test".

The $t$-test is used to determine if a sample mean differs significantly from a known mean or if two sample means differ from each other when sample sizes are small. It's easy to tell if your sample mean is significantly different from a known mean if you have plenty of data, but what do you do when you don't have much data?

You can compute the [$t$-statistic](https://en.wikipedia.org/wiki/T-statistic) as

$$t = \frac{\bar{x} - \mu}{s / \sqrt{n}}$$

where $\bar{x}$ is the sample mean, $\mu$ is the population mean (or hypothesized value), $s$ is the sample standard deviation, and $n$ is the sample size. So $t$ is basically a signal-to-noise ratio, comparing the difference in means to the variability within the data. It follows a [$t$-distribution](https://en.wikipedia.org/wiki/Student%27s_t-distribution) if the sample data is normally distributed and has equal variances. Once you compute the $t$-statistic, you compare it to the critical value from the $t$-distribution for your chosen signifiance level $\alpha$ and degrees of freedom $\nu = n - 1$. If your calculated $t$ exceeds the critical value (i.e. it's extreme enough), you can reject the null hypothesis. The critical values can be computed numerically for a chosen significance level $\alpha$ and increase as $\alpha$ decreases.[^critical-values-t] The test is quite useful and widely used since it adjusts for the increased uncertainty that comes with small sample sizes.

[^critical-values-t]: To compute the critical value $t_c$ for a $t$-distribution with $\nu$ degrees of freedom for the purpose of performing a $t$-test at a significance level of $\alpha$, you can use the formula $\displaystyle t_c = \sqrt{\frac{\nu}{I_{2\alpha}^{-1}(\frac{\nu}{2}, \frac{1}{2})} - \nu}$ where $I^{-1}$ is the inverse of the [_regularized incomplete beta function_](https://en.wikipedia.org/wiki/Beta_function#Incomplete_beta_function), implemented in Mathematica as [`InverseBetaRegularized`](https://reference.wolfram.com/language/ref/InverseBetaRegularized.html).

#### $χ^2$-test

The [chi-squared test](https://en.wikipedia.org/wiki/Chi-squared_test) (or $\chi^2$ test) is another popular test primarily used when working with categorical data. While the $t$-test helps us compare means, the $\chi^2$ test looks at whether observed frequencies differ from expected frequencies in categorical variables. It's particularly useful for analyzing [contingency tables](https://en.wikipedia.org/wiki/Contingency_table) (pivot tables) to determine if there's a significant association between variables.

The test works by comparing what we actually observe with what we would expect to observe if there were no relationship between the variables. The test statistic is calculated as:

$$\chi^2 = \sum_i \frac{(O_i - E_i)^2}{E_i}$$

where $O_i$ are the observed frequencies and $E_i$ are the expected frequencies. This statistic follows a [$\chi^2$ distribution](https://en.wikipedia.org/wiki/Chi-squared_distribution) with the degrees of freedom typically calculated as $(r-1)(c-1)$ for a contingency table with $r$ rows and $c$ columns. If the $\chi^2$ statistic is high enough (above a critical value), we can say the frequencies are significantly different than expected. Its critical values can also be computed numerically.[^critical-values-chi-squared]

[^critical-values-chi-squared]: For a $\chi^2$ distribution the critical values can be computed as $\displaystyle \chi_\alpha^2 = Q^{-1}\left(\frac{k}{2}, \alpha\right)$ where $Q^{-1}$ is the inverse of the [_upper regularized gamma function_](https://en.wikipedia.org/wiki/Incomplete_gamma_function#Regularized_gamma_functions_and_Poisson_random_variables), implemented in Mathematica as [`InverseGammaRegularized`](https://reference.wolfram.com/language/ref/InverseGammaRegularized.html).

#### ANOVA

An [Analysis of Variance (ANOVA)](https://en.wikipedia.org/wiki/Analysis_of_variance) test generalizes the $t$-test to compare the means of three or more groups. While a $t$-test can tell you if two means differ significantly, ANOVA tackles the more general question of "are any of these group means significantly different from each other?" ANOVA answers this question by partitioning the total variability in a dataset into two components: variability between groups and variability within groups. If the differences between group means are large compared to the variability within each group, that suggests real differences rather than just random chance.

The test statistic used in ANOVA is the $F$-statistic, calculated as:

$$F = \frac{\text{variance between groups}}{\text{variance within groups}}$$

The $F$-statistic compares the variability between groups to the variability within groups and follows an [$F$-distribution](https://en.wikipedia.org/wiki/F-distribution) with degrees of freedom $d_1 = k-1$ and $d_2 = N-k$, where $k$ is the number of groups and $N$ is the total sample size. A large $F$-value indicates that the between-group variation dominates, suggesting significant differences between at least some of the group means. The critical values here can also be computed numerically.[^critical-values-f]

[^critical-values-f]: For an $F$-distribution with $d_1$ and $d_2$ degrees of freedom, the critical values can be computed as $\displaystyle F_c = \left( \frac{I_\star^{-1}}{1 - I_\star^{-1}} \right) \frac{d_2}{d_1}$ where $\displaystyle I_\star^{-1} = I_{1-\alpha}^{-1}\left(\frac{d_1}{2}, \frac{d_2}{2}\right)$.

It's important to note that a significant ANOVA result only tells you that differences exist somewhere among your groups. It doesn't tell you which specific groups differ. For that, you need to conduct post-hoc tests.

<!-- ANOVA comes in several forms, with one-way ANOVA being the simplest and most common. In one-way ANOVA, we examine the effect of a single factor (categorical variable) on a continuous outcome. For instance, comparing test scores across three different teaching methods. Multi-way ANOVA extends this by simultaneously examining the effects of two or more factors—like comparing test scores across different teaching methods and different class sizes. This allows us to detect not just the main effects of each factor independently, but also potential interaction effects where the impact of one factor depends on the level of another. Multi-way designs can offer more nuanced insights but require larger sample sizes and more careful interpretation. -->

### Other tests

The hypothesis testing framework we've discussed applies to specialized tests in time series analysis as well. Tests like the Augmented Dickey-Fuller (ADF) and Kwiatkowski-Phillips-Schmidt-Shin (KPSS) tests, which we explore in the main article, follow these same fundamental principles but are specifically designed to test for stationarity properties in time series data. Monte Carlo methods are often used to derive the critical values for these specialized tests since their test statistics don't always follow standard distributions.

#### Model selection using information criteria

When fitting a statistical model to data, like fitting a time series model to time series data, you want to strike a balance between using a model that is too simple (which might underfit the data and miss important patterns) and a model that is too complex (which might overfit and fit noise rather than the signal). Ideally we want a model that fits the observed data well and generalizes to new unseen data while being as simple as possible. Information criteria try to quantify this balance by considering model fit and model complexity to help us choose which model to use.

A common example is fitting a polynomial to data points. A straight line might miss a curve in the data so that's too simple of a model. A 20th-degree polynomial might pass through every point perfectly but will probably perform terribly on new data, having memorized noise rather than learned the pattern. So that's too complex of a model. The best model is probably somewhere in between.

Information criteria are usually calculated like

$$\text{IC} = \text{Badness of fit} + \text{Complexity penalty}$$

so a lower value is better. The badness of fit is usually based on the likelihood so if the observed data is less likely under the model that leads to a higher value. The complexity penalty increases with the number of parameters in the model.

#### AIC (Akaike Information Criterion)

The AIC, developed by Akaike (1973), attempts to estimate how much information is lost when using a model to approximate reality. We can compute it as

$$\text{AIC} =  -2\ln\hat{L} + 2k$$

where $\hat{L}$ is the maximum likelihood value which is the value of the likelihood function evaluated at the best fitting parameters (or the best performance of the model) and $k$ is the number of model parameters. The reason it's called an _information criterion_ is that it's derived using information theory.[^aic-derivation]

[^aic-derivation]: The AIC comes from information theory: Akaike showed that the expected Kullback-Leibler (KL) divergence—which measures information lost when using a model to approximate reality—can be estimated by the negative log-likelihood plus a bias correction. Remarkably, this bias equals the number of parameters k, giving us the elegant penalty term 2k.

Think of AIC as the "prediction-focused" criterion. It's optimistic and eager to add more parameters if it helps prediction.

#### AICc (Corrected AIC)

When the sample size is small, there is a substantial probability that AIC will select models that have too many parameters as the AIC is generally eager to add more parameters. To address such potential overfitting, the AICc was developed. The AICc is just the AIC with a correction for small sample sizes. We can compute it from the AIC as

$$\text{AICc} = \text{AIC} + \frac{k+1}{n-k-1}2k$$

where $n$ is the sample size (number of data points) and $k$ is still the number of model parameters.

So the AICc adds an extra penalty for extra parameters. The penalty is proportional the number of parameters to be estimated $k + 1$ (the variance is the extra parameter here) and inversely proportional to the "residual degrees of freedom" or how many degrees of freedom are left after fitting which is $n - (k + 1)$. So for the same value of $k$, the extra penalty is large if you don't have much data and $n$ is small. But if you have lots of data and $n$ is large then the extra penalty is small (and the AICc is gonna be close to the AIC).

#### BIC (Bayesian Information Criterion)

The BIC, developed by Schwarz (1978), aims to find the true model assuming it's among the model candidates. The idea is that if the true model is among the model candidates and you have enough data, the BIC will eventually select it with probability approaching 1. The AIC, on the other hand, might keep selecting overly complex models even with infinite data. Of course this may never happen because real data is not generated by time series models (it's generated by complex real-life processes) and real data can be quite noisy and you may struggle to collect enough data.

The BIC can be computed as

$$\text{BIC} = -2\ln\hat{L} + k \ln n$$

which is the same as the AIC but the penalty for parameters scales with the amount of data as $\ln n$. So the more data you have, the higher the penalty.

The BIC is Bayesian by derivation.[^bic-derivation]

[^bic-derivation]: The BIC approximates the Bayes factor, which compares the posterior probability of different models—it's derived using Laplace's method to approximate the marginal likelihood of each model. This Bayesian foundation means BIC asymptotically selects the model with highest posterior probability, making it "truth-seeking" in the sense that it will identify the correct model (if it's among the candidates) as data accumulates.

### How to use information criteria

So when should you use each criterion? If you just want good predictions and forecasts, then the AIC might be the one to use. Think of it as saying "reality is complex and all models are approximations" and you just want to select the model with the best predictive power, even if it's a bit more complex than necessary. If you don't have much data (the rule of thumb seems to be $n/k < 40$) then consider using the AICc since there's basically no downside (when you have lots of data the AICc converges to the AIC anyways). If you think a simple true model exists and you want to select it, then the BIC might be the one to use. So maybe the BIC is more useful if you want to select the model that explains the data. One way to think of it is that the AIC/AICc is the pragmatist's choice while the BIC is the scientist's choice.

When choosing between models, you should look at the differences in IC values rather than the absolute numbers which don't mean much on their own. As a rule of thumb if $Δ\text{IC} < 2$ then the models are essentially equivalent, if $2 ≤ Δ{IC} < 7$ then there's moderate evidence favoring the model with lower IC, and if $Δ\text{IC} ≥ 10$ then there's strong evidence favoring the model with lower IC. These ratios from the mathematics of likelihood ratios and evidence strength.

You should calculate multiple criteria. When they agree, you have strong evidence for your model choice. When they disagree (like AIC selecting a complex model while BIC prefers a simpler one), it reveals a fundamental tradeoff between predictive accuracy and simplicity. This disagreement itself is informative—it tells you whether adding complexity genuinely improves predictions or just fits noise.

Remember that these criteria can only compare models fit to the same data. You can't compare AIC values between different datasets or even different transformations of the same data (like comparing a model of y versus a model of log(y)).

### Prediction intervals. vs. conformal prediction?

Show a couple of plots to highlight the difference?

## References

<!--
Holt, C. C. (1957). Forecasting seasonals and trends by exponentially weighted averages (ONR Memorandum No. 52). Carnegie Institute of Technology, Pittsburgh USA. Reprinted in the International Journal of Forecasting, 2004. [DOI]

Winters, P. R. (1960). Forecasting sales by exponentially weighted moving averages. Management Science, 6(3), 324–342. [DOI]
 -->

<div class="references">

<div id="dagum2016">
  <span class="ref-author-list">Dagum, E. B., & Bianconcini, S. (2016).</span>
  <i>Seasonal adjustment methods and real time trend-cycle estimation</i>. Springer International Publishing. 283 pp.
  <a href="https://doi.org/10.1007/978-3-319-31822-6" target="_blank" class="button">doi</a>
</div>

<div id="dickey1979">
  <span class="ref-author-list">Dickey, D. A., & Fuller, W. A. (1979).</span>
  Distribution of the estimators for autoregressive time series with a unit root. <i>Journal of the American Statistical Association</i> <b>74</b>(366a), 427–431.
  <a href="https://doi.org/10.1080%2F01621459.1979.10482531" target="_blank" class="button">doi</a>
</div>

<div id="findley1998">
  <span class="ref-author-list">Findley, D. F., Monsell, B. C., Bell, W. R., Otto, M. C., & Chen, B.-C. (1998).</span>
  New Capabilities and Methods of the X-12-ARIMA Seasonal-Adjustment Program. <i>Journal of Business & Economic Statistics</i> <b>16</b>(2), 127-152.
  <a href="https://doi.org/10.1080/07350015.1998.10524743" target="_blank" class="button">doi</a>
</div>

<div id="ham2019">
  <span class="ref-author-list">Ham, Y. G., Kim, J. H. & Luo, J. J. (2019).</span>
  Deep learning for multi-year ENSO forecasts. <i>Nature</i> <b>573</b>, 568–572.
  <a href="https://doi.org/10.1038/s41586-019-1559-7" target="_blank" class="button">doi</a>
</div>

<div id="henderson1916">
  <span class="ref-author-list">Henderson, R. (1916).</span>
  Note on Graduation by Adjusted Average. <i>Transactions of the American Society of Actuaries</i> <b>17</b>, 43–48.
  <a href="/files/time-series-zoo/Henderson (1916), Note on Graduation by Adjusted Average, Transactions of the American Society of Actuaries.pdf" target="_blank" class="button">pdf</a>
  <a href="https://archive.org/details/transactions17actuuoft/page/42/mode/2up" target="_blank" class="button">source</a>
</div>

<div id="henshaw2019">
  <span class="ref-author-list">Henshaw, J. L. (2019).</span>
  The systemic growth constants of climate change: From its origin in 1780 to its major post-WWII acceleration. <i>arXiv</i> preprint arXiv:1911.04340.
  <a href="https://doi.org/10.48550/arXiv.1911.04340" target="_blank" class="button">doi</a>
</div>

<div id="hyndman2021">
  <span class="ref-author-list">Hyndman, R. J., & Athanasopoulos, G. (2021).</span>
  <i>Forecasting: principles and practice</i>, 3rd edition. OTexts: Melbourne, Australia.
  <a href="https://otexts.com/fpp3" target="_blank" class="button">url</a>
</div>

<div id="keeling1960">
  <span class="ref-author-list">Keeling, C. D. (1960).</span>
  The concentration and isotopic abundances of carbon dioxide in the atmosphere. <i>Tellus</i> <b>12</b>(2), 200-203.
  <a href="https://doi.org/10.3402/tellusa.v12i2.9366" target="_blank" class="button">doi</a>
</div>

<div id="keeling2005">
  <span class="ref-author-list">Keeling, C. D., Piper, S. C., Bacastow, R. B., Wahlen, M., Whorf, T. P., Heimann, M., &
Meijer, H. A. (2005).</span>
  Atmospheric CO<sub>2</sub> and <sup>13</sup>CO<sub>2</sub> exchange with the terrestrial biosphere and oceans from 1978 to 2000: observations and carbon cycle implications.
  In <i>A History of Atmospheric CO2 and its effects on Plants, Animals, and Ecosystems</i>, ed. Ehleringer, J.R., Cerling, T. E., & Dearing M. D., 83-113.
  Springer Verlag. xxx pp.
  <a href="https://doi.org/10.3402/tellusa.v12i2.9366" target="_blank" class="button">doi</a>
</div>

<div id="kwiatkowski1992">
  <span class="ref-author-list">Kwiatkowski, D., Phillips, P. C. B., Schmidt, P., Shin, Y. (1992).</span>
  Testing the null hypothesis of stationarity against the alternative of a unit root: How sure are we that economic time series have a unit root? <i>Journal of Econometrics</i> <b>54</b>(1-3), 159-178.
  <a href="https://doi.org/10.1016/0304-4076(92)90104-Y" target="_blank" class="button">doi</a>
</div>

<div id="ladiray2001">
  <span class="ref-author-list">Ladiray, D., & Quenneville, B. (2001)</span>
  <i>Seasonal Adjustment with the X-11 Method</i>. Springer Science+Business Media. 256 pp.
  <a href="" target="_blank" class="button">doi</a>
</div>

<div id="macaulay1931">
  <span class="ref-author-list">Macaulay, F. R. (1931)</span>
  <i>The Smoothing of Time Series</i>. National Bureau of Economic Research. 169 pp.
  <a href="/files/time-series-zoo/Macaulay (1931), The Smoothing of Time Series, National Bureau of Economic Research.pdf" target="_blank" class="button">pdf</a>
  <a href="https://www.nber.org/books-and-chapters/smoothing-time-series" target="_blank" class="button">source</a>
</div>

<div id="mackinnon2010">
  <span class="ref-author-list">MacKinnon, J. G. (2010).</span>
  Critical Values For Cointegration Tests. <i>Working Paper 1227</i>, Economics Department, Queen's University.
  <a href="https://ideas.repec.org/p/qed/wpaper/1227.html" target="_blank" class="button">url</a>
</div>

<div id="nandy2021">
  <span class="ref-author-list">Nandy, D. (2021).</span>
  Progress in Solar Cycle Predictions: Sunspot Cycles 24–25 in Perspective. <i>Solar Physics</i> <b>296</b>, 54.
  <a href="https://doi.org/10.1007/s11207-021-01797-2" target="_blank" class="button">doi</a>
</div>

<div id="noaa2024">
  <span class="ref-author-list">NOAA. (2024).</span>
  Climate Change: Atmospheric Carbon Dioxide. <i>NOAA Climate.gov</i>.
  <a href="https://www.climate.gov/news-features/understanding-climate/climate-change-atmospheric-carbon-dioxide" target="_blank" class="button">url</a>
</div>

<div id="shiskin1967">
  <span class="ref-author-list">Shiskin, J., Young, A. H., & Musgrave, J. C. (1967).</span>
  The X-11 Variant of the Census Method II Seasonal Adjustment Program. Technical Paper 15 (revised). <i>US Department of Commerce,
Bureau of the Census, Washington, DC.</i>
  <a href="https://www.census.gov/library/working-papers/1967/adrm/shiskin-01.html" target="_blank" class="button">url</a>
  <a href="https://www.census.gov/content/dam/Census/library/working-papers/1967/adrm/shiskinyoungmusgrave1967.pdf" target="_blank" class="button">pdf</a>
</div>

<div id="student1908">
  <span class="ref-author-list">Gosset, W.S. (1908).</span>
  The probable error of a mean. <i>Biometrika</i> <b>6</b>(1), 1-25.
  <a href="https://doi.org/10.2307/2331554" target="_blank" class="button">doi</a>
</div>


<div id="wolter2011">
  <span class="ref-author-list">Wolter, K. & Timlin, M. S. (2011).</span>
  El Niño/Southern Oscillation behaviour since 1871 as diagnosed in an extended multivariate ENSO index (MEI.ext). <i>International Journal of Climatology</i> <b>31</b>, 1074-1087.
  <a href="https://doi.org/10.1002/joc.2336" target="_blank" class="button">doi</a>
</div>

</div>
