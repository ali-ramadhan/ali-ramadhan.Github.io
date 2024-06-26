---
layout: post
title: "Touring a mini-zoo of time series and forecasting methods"
enable_mathjax: true
---

1. Do not remove this line (it will not be displayed)
{:toc}


# What are we even doing?

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

# The time series zoo

I collected some interesting and varied time series to play around with and populate the mini-zoo, which I'll describe here. All data is stored in my [`time-series-forecasting`](https://github.com/ali-ramadhan/time-series-forecasting) GitHub repository along with code for turning it into a [`pandas.Series`](https://pandas.pydata.org/docs/reference/api/pandas.Series.html) or [`darts.TimeSeries`](https://unit8co.github.io/darts/generated_api/darts.timeseries.html) and links to where the data was sourced from.

## Keeling Curve
{:.no_toc}

The [Keeling Curve](https://en.wikipedia.org/wiki/Keeling_Curve) represents the CO<sub>2</sub> concentration in the Earth's atmosphere based on continuous measurements taken at the Mauna Loa Observatory on the island of Hawaii since 1958. It's a pretty simple time series with a slowly increasing trend and a pretty regular seasonal cycle with a period of 12 months corresponding to the seasonal cycle.

CO<sub>2</sub> level increase in the spring and summer as new vegetation growth pulls CO<sub>2</sub> out of the atmosphere through photosynthesis, then decrease in the fall as plants and leaves die off and decay, releasing CO<sub>2</sub> back into the atmosphere. Since Hawaii is quite isolated from sources of pollution and human activity and Mauna Loa is quite high up, the seasonal cycle exhibits little noise or variability, which will make it easier to forecast. In the Southern Hemisphere the cycle is reversed but it is also less pronounced as the Southern Hemisphere has less land and less vegetation as a result.                                                                  

Measurements were first taken by [Keeling (1960)](#keeling1960) and they're more thoroughly discussed in [Keeling et al. (2005)](#keeling2005).

We'll just look at monthly measurements (from the 15th of each month) but more frequent observations are available.

## Sunspot number
{:.no_toc}

This is the number of [sunspots](https://en.wikipedia.org/wiki/Sunspot) on the Sun's surface. It's the monthly mean total sunspot number since 1749 obtained by taking a simple arithmetic mean of the daily total sunspot number over all days of each calendar month.

Sunspots are cold dark spots on the solar surface caused by concentrations of magnetic flux that inhibit convection. The cyclical behavior is the [solar cycle](https://en.wikipedia.org/wiki/Solar_cycle), a roughly 11-year cycle with significant amplitude variations. Each cycle the sun exhibits increased magnetic activity in the form of sunspots, solar flares, and coronal mass ejections. The period of low sunspot count from roughly 1796 to 1820 correspond to the [Dalton Minimum](https://en.wikipedia.org/wiki/Dalton_Minimum). The exact cause of such minima is not well understood. Predicting future solar cycles may be impossible due to the chaotic nature of the solar surface magnetic field, however short-term predictions of the upcoming solar cycle are possible based on a causal relationship between the Sun's polar field and the toroidal field of the next sunspot cycle [(Nandy, 2021)](#nandy2021). This suggests that we should be forecasting one solar cycle ahead for validation and testing.

## Multivariate ENSO Index
{:.no_toc}

ENSO is the [El Niño-Southern Oscillation](https://en.wikipedia.org/wiki/El_Ni%C3%B1o%E2%80%93Southern_Oscillation). It's a large scale pattern of warm sea surface temperatures in the tropical Pacific Ocean during El Niño, and cold during La Niña, with worldwide effects. It's the strongest [climate oscillation](https://en.wikipedia.org/wiki/Climate_variability_and_change#Oscillations) and the most prominent source of inter-annual variability.

The Multivariate ENSO Index (MEI) is a method used to characterize the intensity of an ENSO event [(Wolter & Timlin, 2011)](#wolter2011). Like other climate oscillations, ENSO is quasi-periodic with a period of 2-7 years making it difficult to forecast. While Earth's climate is a chaotic system, convolutional neural networks looking at sea surface temperature and oceanic heat content in the Pacific can provide skillful forecasts with a lead time of 1.5 years and older methods can go up to a year [(Ham et al., 2019)](#ham2019). This suggests that we may be able to forecast a year out, but a forecast based solely on the MEI (like what we're doing) might not actually be skillful.

## Durban temperature
{:.no_toc}

This is an hourly time series of surface air temperature near Durban, South Africa from 1940-2023 obtained from the ERA5 climate reanalysis product. It has many more observations than the previous time series so . There are multiple scales of seasonality and variability from the diurnal cycle and day-to-day variability of weather to the seasonal cycle and inter-annual variability, with potentially signals of climate change on top.

## Global price of wheat
{:.no_toc}

This is the global price of wheat for each month since 1990. The underlying generating process behind this time series is the entire global economy so there's probably no hope of being able to forecast this with any significant lead. But it's worth seeing what the forecasts look like, maybe we can identify some false positives. It might also be worth seeing if we can successfully make short-term forecasts.

## USD-JPY exchange rate
{:.no_toc}

Daily exchange rate since 2005. Same comments as above.

## LW stock price
{:.no_toc}

This is the stock price of Lamb Weston Holdings, Inc. (ticker symbol: LW) during March 2024 trading hours at a resolution of a few minutes. The above comments on unpredictibility still hold, but what might be interesting here is whether we are able to make forecasts on what the stock price does in the second half of the trading day given we know what it did in the first.

## ERCOT electrical load
{:.no_toc}

This is the hourly electrical load in Texas for each control area served by ERCOT (Electric Reliability Council of Texas) between 2004-2023. There are multiple scales of seasonality and variability again with a long-term increasing trend.

https://en.wikipedia.org/wiki/January_31_%E2%80%93_February_2,_2023_North_American_ice_storm

## Transformer oil temperature
{:.no_toc}

Electrical load and oil temperature at 15-minute and 1-hour intervals from two electricity transformers in China.

## Cheese sales
{:.no_toc}

Store-level scanner data of cheese sales at Dominick's Finer Foods, a now-defunct grocery store chain in the Chicago area, from 1989-1994. We will be looking at and forecasting chain-wide weekly cheese sales.

## Uber pickups
{:.no_toc}

Uber pickups from January to June 2015 in New York City. We'll be looking at and forecasting hourly pickups.

# Time series decomposition

<!-- In this section, show an example of an additive decomposition and another of a multiplicative decomposition. Also show the Fourier transform and the correlation between the components? -->

The idea with decomposing a time series $y_t$ is to write it as $y_t = S_t + T_t + R_t$ where $y_t$ is the data, $S_t$ is the seasonal component, $T_t$ is the trend-cycle component, and $R_t$ is the remainder component (sometimes called the irregular component), all at time $t$. This is called an additive decomposition, but you can also do a multiplicative decomposition where $y_t = S_t \times T_t \times R_t$.[^multiplicative-decomposition]

[^multiplicative-decomposition]: Why? If seasonality and irregular components vary with the magnitude of the signal.

Why do we want/need decompositions? Maybe we just need to inspect and forecast the trend and the seasonality just gets in the way. As we'll find out, seasonally adjusting a time series is not trivial. It can also be easier to make forecasts of the trend and seasonal components separately. What else?

A point to make and a test we can code/run? The different components should not be correlated!

## Classical or naive decomposition
{:.no_toc}

In classical decomposition, we assume that the seasonal component is constant from year to year. For multiplicative seasonality, the m values that form the seasonal component are sometimes called the “seasonal indices”.

## X13-ARIMA-SEATS
{:.no_toc}

[X13-ARIMA-SEATS](https://www.census.gov/data/software/x13as.html) is an advanced and complex seasonal adjustment open-source software package developed by the U.S. Census Bureau. It's the 13th and latest version of a software package used by the U.S. Census Bureau since the 1950's. The first version, Census Method I, was based off the work of [Macauley (1931)](#macauley1931) on smoothing time series.[^smoothing]

[^smoothing]: Smoothing is useful to reduce noise in time series and identify trends and seasonality, making it easier to visualize and forecast. Macauley emphasized the importance of not just relying on a simple moving average which has a few issues. It weighs data points in the averaging window equally when more recent points may be more relevant. It cannot be used at the endpoints. It tends to lag behind the original data. And it can be significantly impacted by outliers. The answer is to use a weighted moving average such as the Henderson moving average.[^henderson]

[^henderson]: The Henderson moving average or filter.

Census Method I was followed by Census Method II and eleven more experimental versions (X1, X2, ..., X11) until Census Method II-X11 [(Shiskin et al., 1967)](#shiskin1967) was probably good enough to be used widely. But X11 did have a major weakness. X11 produced poor seasonally adjusted data at the end of the time series which made it hard to assess and forecast the direction of short-term trends. At Statistics Canada [Dagum (1978)](#dagum1978) developed X11-ARIMA to combat this weakness by using an appropriate ARIMA model to forecast a bit beyond the end of the time series and backcast a bit before the start, thereby allowing us to use symmetric weighted moving averages over the entire time series. Later [Findley et al. (1998)](#findley1998) developed X12-ARIMA in which the ARIMA model includes regression variables (so it's now called regARIMA) to capture deterministic components such as trading day effects (certain months have more trading days which can affect economic time series), moving holiday effects, and outliers. Once the deterministic components have been taken out, the time series is confusingly said to be <i>linearized</i>.

X13-ARIMA-SEATS extends X12-ARIMA by using SEATS (Seasonal Extraction in ARIMA Time Series) after the deterministic components have been taken out. SEATS takes the linearized time series and assumes that each component can be modeled as an ARIMA process. It does this by using the canonical decomposition which maximizes the variance of the irregular component while ensuring that the other components are uncorrelated. Once SEATS has identified an ARIMA model for each component, it uses the Wiener-Kolmogorov filter to actually estimate the components. The WK filter is designed to give the minimum mean square error (MMSE) estimates of the components. In other words, it tries to make the estimated components as close as possible to the "true" unobserved components. So X13-ARIMA pre-adjusts the time series then SEATS takes the linearized time series and does the decomposition. Another similar method is TRAMO-SEATS.[^tramo-seats]

[^tramo-seats]: TRAMO-SEATS is another method similar to X13-ARIMA-SEATS. TRAMO stands for Time Series Regression with ARIMA Noise, Missing Observations, and Outliers. It was developed at the Bank of Spain and is implemented by the [Demetra+](https://en.wikipedia.org/wiki/Demetra%2B) software package. It similarly accounts for calendar day effects and outliers and also uses SEATS for the decomposition.

In general, methods like X13-ARIMA-SEATS are very detailed and describing them in detail would take up an entire blog post at least. For more of an overview I would refer to [Dagum & Bianconcini (Ch. 4, 2016)](#dagum2016). If you want a much more detailed description of the X11 method see [Ladiray & Quenneville (2001)](#ladiray2001). It's an entire book dedicated to describing the X11 method!

It's probably worth noting that X11 methods are still mainly designed to work with quarterly or monthly time series.

## Seasonal and Trend decomposition using Loess (STL)
{:.no_toc}

Seasonal and Trend decomposition using LOESS (STL) also decomposes a time series into three components: trend, seasonality, and residual. LOESS (Locally Estimated Scatterplot Smoothing) is how STL removes or isolates the trend component. It fits a smooth curve to the data by fitting a low-order polynomial locally to each data point that gives more weight to nearby points and less weight to distant points. A traditional distance function is the tri-cube distance function $w(d) = (1 - \|d\|^3)^3$ where $d$ is scaled to be $0 \le d \le 1$. For each data point, LOESS defines a neighborhood of points close to it, assigns a weight to each point in the neighborhood, and fits a low-degree (order 0-2) polynomial using a weighted least squares regression. The smoothed value is then the value of the fitted polynomial at that data point. This smooth curve is then the trend component. Subtracting the trend out of the time series, STL uses LOESS again on the detrended time series to estimate the seasonal component. Subtracting the trend and seasonal components from the time series gives the residual component.

Because STL relies on LOESS it can handle different types of seasonality and varying seasonality. It is also robust to missing values and outliers. As X13-ARIMA-SEATS assumes fixed seasonal periods which are very common in economic time series, STL is better for time series exhibiting other seasonalities. LOESS is a non-parametric method, not assuming any specific form for the trend or seasonal components, so it may capture non-linear patterns better than ARIMA models. STL can scale to larger datasets better. But it can't account for calendar effects.

# Stationarity and unit root tests

To properly use some time series models the time series needs to be stationary. This mostly applies to the ARIMA models for this post. A time series is considered to be <i>stationary</i> if its statistical properties (e.g. mean, variance, and autocorrelation) do not change with time.

Formally, a stochastic process $X_t$ is said to be [<i>strictly stationary</i>](https://en.wikipedia.org/wiki/Stationary_process#Strict-sense_stationarity) if its joint distribution of $(X_{t_1}, X_{t_2}, ..., X_{t_n})$ is identical to the joint distribution of $(X_{t_1+\tau}, X_{t_2+\tau}, ..., X_{t_n+\tau})$ for all $n$, all time indices $t_1, t_2, \dots, t_n$ and time lags $\tau$. So all statistical properties of the time series are invariant under time shifts.

The strict definition above is a bit strict for practical purposes, so we can use a weaker definition. A stochastic process is [<i>weak-sense stationary</i>](https://en.wikipedia.org/wiki/Stationary_process#Weak_or_wide-sense_stationarity) if its mean is constant over time, $E[X_t] = E[X_{t+\tau}]$, its autocovariance only depends on the time lag, $Cov[X_t, X_{t+\tau}] = \gamma(\tau)$, and its variance is finite, $Var[X_t] < \infty$.

In practice, weak-sense stationarity is enough for most time series analyses as many methods mostly rely on the first and second moments which are captured by the mean and autocovariance. But most real-world data is not stationary or close to it, unless transformed. To use e.g. ARIMA models we need to make the time series stationary. To do so we can difference the time series, a key feature of ARIMA models, and work with $\Delta X_t = X_t - X_{t-1}$. Removing the trend or seasonal patterns may be enough. Looking at $\log X_t$ can also help make the time series more stationary by stabilizing a fluctuating variance.

There are some common statistical tests used to determine whether a time series is stationary or not. Here we'll look at two of them: the Augmented Dickey-Fuller test and the Kwiatkowski-Phillips-Schmidt-Shin (KPSS) test.

These tests check for stationarity by testing whether a [<i>unit root</i>](https://en.wikipedia.org/wiki/Unit_root) is present in a time series. Technically in the context of time series, a unit root exists when the characteristic equation of the stochastic process has a root equal to 1. But I think it's more useful to look at a more concrete example to understand the effects of a unit root.

Let's consider the AR(1) process $y_t = c + \rho y_{t-1} + \varepsilon_t$ where $y_t$ is the value at time $t$, $\rho$ is the autoregressive coefficient, and $\varepsilon_t$ is white noise.

* If $\|\rho\| < 1$ then we have a <i>stationary process</i>. The process will tend to revert to its long-run mean of $c / (1 - \rho)$, and shocks have temporary effects that decay over time.
* If $\|\rho\| = 1$ then we have a <i>unit root process</i>. The process does not revert to any fixed mean and shocks have permanent effects on the level of the series.
* If $\|\rho\| > 1$ then we just have an <i>explosive process</i>. The process diverges growing exponentially over time and shocks not only persist but are amplified over time.
* If $\rho < 1$ then the values of $y_t$ will fluctuate between positive and negative values.

So the statistical tests try to check whether $\|\rho\| = 1$ or $\|\rho\| < 1$.

You can get $\rho > 1$ processes in the real-world, e.g. financial bubbles and viral spread, but they are temporary, localized phenomena rather than long-term, stable processes. This stuff is super hard to forecast anyways. You can also get negative $\rho$ processes in the real-world, e.g. in some regions wet days may be more likely to be followed by a dry day and vice versa, or stock returns may sometimes oscillate between positive and negative due to mean reversion or overreaction.

## Augmented Dickey-Fuller test
{:.no_toc}

The original test, not augmented, was introduced by [Dickey & Fuller (1979)](#dickey1979). It tests the null hypothesis that a unit root is present in an autoregressive model. It considered the AR model

$y_t = \rho y_{t-1} + \varepsilon_t$

which has a unit root if $\rho = 1$. It then considers the first difference,

$\Delta y_t = (1 - \rho) y_{t-1} + \varepsilon_t = \delta y_{t-1} + \varepsilon_t$

where $\delta = \rho - 1$ so we can test whether $\delta = 0$. Taking this model, the value and standard error of $\delta$ can be estimated using least squares to form the Dickey-Fuller statistic $\textrm{DF}_\delta = \hat{\delta} / \textrm{SE}(\delta)$ which looks like a $t$-statistic, but instead of following a $t$-distribution it follows a distribution with no closed form so [Dickey & Fuller (1979)](#dickey1979) tabulate critical values of the Dickey-Fuller statistic. The critical values can be computed using Monte Carlo simulations, although packages like `statsmodels` tend to interpolate the tables.

There are three versions of the test depending on whether you want to include a constant term and also a linear trend, but otherwise the Dickey-Fuller test has some major limitations. It's based on a simple AR(1) model which may not capture the complex dynamics present in many time series. It also assumes the error terms in the model are uncorrelated which is not true of many real-world time series.

The Augmented Dickey–Fuller (ADF) test was developed to address these limitations. The testing procedure is the same as for the Dickey–Fuller test but we instead use this more flexible model:

$\Delta y_t = \alpha + \beta t + \gamma y_{t-1} + \delta_1 \Delta y_{t-1} + \cdots + \delta_{p-1} \Delta y_{t-p+1} + \varepsilon_t$

So we're considering an AR($p$) model with a constant term $\alpha$ and time trend coefficient $\beta$. The null hypothesis for the unit root test is that $\gamma = 0$ against the alternative hypothesis of $\gamma < 0$.

statistic, used in the test, is a negative number. The more negative it is, the stronger the rejection of the hypothesis that there is a unit root at some level of confidence.

The problem you're referring to in the context of the Dickey-Fuller test is called the "near-unit root problem" or sometimes the "near-integration problem."

## Kwiatkowski–Phillips–Schmidt–Shin (KPSS) test
{:.no_toc}

The KPSS test, developed by [Kwiatkowski et al. (1992)](#kwiatkowski1992), takes a different approach to testing for stationarity. It's null hypothesis is that the time series is stationary and the alternative hypothesis is that a unit root is present. The test considers the model

$y_t = \alpha + \delta t + r_t + e_t$

where $\alpha$ is a constant term, $\delta t$ is a deterministic trend, and $e_t$ is a stationary error term. $r_t = r_{t-1} + u_t$ is a random walk where $u_t \sim iid(0, \sigma_u^2)$ is identically distributed noise with zero mean and constant variance $\sigma_u^2$.

The null hypothesis is that $\sigma_u^2 = 0$. In this case $r_t = r_0$ and $y_t$ is stationary. Well, it's stationary around zero if $\alpha = \delta = 0$, level-stationary if $\delta = 0$, and stationary around a deterministic trend if both $\alpha$ and $\delta$ are non-zero. The alternative hypothesis is $\sigma_u^2 > 0$.

The KPSS test statistic is a bit more involved:

$\displaystyle \eta = \frac{1}{T^2} \frac{\displaystyle \sum_{t=1}^{T} S_t^2}{\hat{\sigma}_\infty^2}$

where $T$ is the sample size (length of the time series). $S_t = \sum_{i=1}^t \hat{e}_i$ is the partial sum of residuals where $\hat{e}_i$ are the residuals from a regression of $y_t = α + δt + \hat{e}_t$.

$\hat{\sigma}_\infty^2$ is an estimate of the long-run variance of the residuals which captures the total impact of a shock over time, accounting for both immediate effects and lingering effects in subsequent periods. Unlike the simple variance, which only considers contemporaneous relationships, the long-run variance incorporates autocovariances at various lags. This is particularly important in time series data where observations are often correlated over time. A common way to estimate the long-run variance is using a heteroskedasticity and autocorrelation consistent (HAC) estimator, typically the Newey-West estimator. This approach accounts for potential autocorrelation in the residuals.

The test statistic examines how much the cumulative sum of the residuals fluctuates. If the fluctuations are small, $\eta$ is small and the time series is more likely to be stationary. If the fluctuations are large, $\eta$ is large and the time series is more likely to contain a unit root. If $\eta$ is larger than some critical value we can reject the null hypothesis.

The KPSS test relies on several key assumptions:

1. Under the null hypothesis, the series is assumed to be stationary or trend-stationary.
2. Under the alternative hypothesis, the series is assumed to have a unit root.
3. The error terms $e_t$ are assumed to be stationary and weakly dependent.
4. The test assumes that any non-stationarity in the series can be adequately captured by a deterministic trend and/or a random walk component.

It's important to note that the KPSS test, like many statistical tests, is based on asymptotic theory. This means its properties are guaranteed as the sample size approaches infinity. In finite samples, especially small ones, the test's performance may deviate from its theoretical properties.

Furthermore, the test's power (ability to correctly reject the null when it's false) can be affected by the presence of structural breaks or other forms of non-linearity in the data. Therefore, it's always advisable to combine the KPSS test with visual inspection of the data and other complementary tests for a comprehensive analysis of stationarity.

The KPSS test is often used in conjunction with other tests like the ADF test to make more robust conclusions about stationarity.

<!-- Let's do this in the proper sections!
# Analyzing each time series

* Look at trend-cycle decompositions and stationarity for each time series.
* We're looking for something stationary to predict in each? Depends on the method I guess.
-->

# Forecasting time series!

Explain that we're splitting into train, val, and test. Must be in chronological order. 

When possible we'll make probabilistic forecasts.

## Exponential smoothing (Holt-Winters')

Does quite well on the Keeling Curve.

<figure class="centered" markdown="block">

![exponential smoothing best model keeling](/img/time-series-zoo/exponential_smoothing_best_model_keeling.png)

<figcaption>Exponential smoothing best model Keeling Curve.</figcaption>

</figure>

We can look at some models:

<figure class="centered" markdown="block">

<video class="full-width-video" controls>
  <source src="/img/time-series-zoo/exponential_smoothing_models_keeling.mp4" type="video/mp4">
</video> 

<figcaption>Exponential smoothing best model Keeling Curve.</figcaption>

</figure>

For sunspots we're going to have to do some transformation. It's a time series of counts so forecasts shouldn't predict negative counts. It also has observations of zero which can be an issue. We'll transform it using the Box-Cox transform.

Method needs to account for all seasonality lags, and with an ~11 year cycles that at least 132 periods, maybe feels like a lot. We'll look at the yearly mean sunspot number for exponential smoothing. Then we just need a ~11 periods.

<figure class="centered" markdown="block">

![exponential smoothing best model sunspots](/img/time-series-zoo/exponential_smoothing_best_model_sunspots.png)

<figcaption>Exponential smoothing best model Keeling Curve.</figcaption>

</figure>

Struggles to predict sunspot number. We picked the model that did the best on the verification time series, where it kinda got the timing of the cycles right but completely fails to capture the amplitude. It's too simple, it can't. As a result it does a bad job in predicting the timing of the cycles in the test set. Again, it can only handle well-defined seasonality and not .

A big difference for sunspots is the huge confidence intervals on the forecast. Error accumulates over the course of the forecast, but since the Keeling Curve had a much better fit the variance of the error term is quite small. For sunspots, the fit isn't as good so the variance on the error term is quite large so it can accumulate very quickly.

<figure class="centered" markdown="block">

<video class="full-width-video" controls>
  <source src="/img/time-series-zoo/exponential_smoothing_models_sunspots.mp4" type="video/mp4">
</video> 

<figcaption>Exponential smoothing best model Keeling Curve.</figcaption>

</figure>

<!-- Plot both transformed and untransformed forecasts? -->

No point trying on MEI or any of the financial time series.

## Autoregressive?
{:.no_toc}

## Moving average?
{:.no_toc}

## ARIMA
{:.no_toc}

## TBATS?
{:.no_toc}

## Prophet
{:.no_toc}

# What else can we do?

* Covariates.
* Multiple time series.

# Appendices

## General resources
{:.no_toc}

online textbook, python book?

## Statistical hypothesis testing
{:.no_toc}

We use some hypothesis tests here and I was a little rusty/fuzzy on the details so this is just a brief aside on them and things to be careful of when using them.

A statistical hypothesis test aims to infer something about a population (e.g. a mean, proportion, or variance) based on sample data. You set up a null hypothesis $H_0$ and an alternative hypothesis $H_1$, then conduct a test based on the sample data and decide whether you are able to reject the null hypothesis $H_0$ with some confidence level. Usually the null hypothesis states that there is no difference or no relationship but it can take various forms, while the alternative hypothesis $H_1$ usually claims the opposite. To decide whether we can reject $H_0$, we compute a <i>test statistic</i> from the sample data and null hypothesis. The test statistic may follow some known probability distribution (under certain assumptions) and based on how extreme the test statistic is, we may be able to reject $H_0$. The <i>p-value</i> is the probability of observing a test statistic as extreme under the null hypothesis. You choose the threshold for rejecting $H_0$ at a specific significance level, often denoted as $\alpha$, based on your desired false-positive rate.

You generally need to be careful when using hypothesis tests. The tests often assume the data is e.g. normal or independent. 

Moreover, a non-significant p-value does not prove the null hypothesis; it only suggests lack of evidence against it.
Sample Size and Power: The sample size plays a crucial role in hypothesis testing. Small sample sizes may lack the power to detect true effects, leading to false negatives (Type II errors). Adequate sample sizes should be determined based on the desired power and effect size.
Contextual Factors: P-values and hypothesis tests should be interpreted within the context of the research question, study design, and domain knowledge. Relying solely on p-values without considering other factors can lead to misinterpretations and flawed conclusions.

A commonly used hypothesis test, developed by (Student, 19xx?) of Guiness, is the [$t$-test](https://en.wikipedia.org/wiki/Student%27s_t-test) used to test if a sample mean differs from a known mean. The [$t$-statistic](https://en.wikipedia.org/wiki/T-statistic) is a signal-to-noise ratio of the difference in group means over the variability and follows a [$t$-distribution](https://en.wikipedia.org/wiki/Student%27s_t-distribution) if the sample data is normal and has equal variances. Its critical values (above which $H_0$ can be rejected) can be computed numerically.[^critical-values-t]

[^critical-values-t]: To compute the critical value $t_c$ for a $t$-distribution with $\nu$ degrees of freedom for the purpose of performing a $t$-test at a significance level of $\alpha$, you can use the formula $\displaystyle t_c = \sqrt{\frac{\nu}{I_{2\alpha}^{-1}(\frac{\nu}{2}, \frac{1}{2})} - \nu}$ where $I^{-1}$ is the inverse of the [_regularized incomplete beta function_](https://en.wikipedia.org/wiki/Beta_function#Incomplete_beta_function), implemented in Mathematica as [`InverseBetaRegularized`](https://reference.wolfram.com/language/ref/InverseBetaRegularized.html).

Used to test the association between two categorical variables or to compare observed frequencies with expected frequencies.
Test Statistic: Chi-square statistic, which measures the deviation between observed and expected frequencies.
P-value Interpretation: The probability of observing a chi-square statistic as extreme as or more extreme than the calculated value, assuming the null hypothesis of no association is true.
Common Misuse: Applying the chi-square test when the expected frequencies are small (less than 5) without using appropriate corrections or alternative tests.

Its critical values can be computed numerically.[^critical-values-chi-squared]

[^critical-values-chi-squared]: For a $\chi^2$ distribution the critical values can be computed as $\displaystyle \chi_\alpha^2 = Q^{-1}\left(\frac{k}{2}, \alpha\right)$ where $Q^{-1}$ is the inverse of the [_upper regularized gamma function_](https://en.wikipedia.org/wiki/Incomplete_gamma_function#Regularized_gamma_functions_and_Poisson_random_variables), implemented in Mathematica as [`InverseGammaRegularized`](https://reference.wolfram.com/language/ref/InverseGammaRegularized.html).


An [Analysis of Variance (ANOVA)](https://en.wikipedia.org/wiki/Analysis_of_variance) test generalizes the $t$-test to compare the means of three or more groups. The $F$-statistic compares the variability between groups to the variability within groups and follows an $F$-distribution.

ANOVA (Analysis of Variance):
Used to compare the means of three or more groups.
Test Statistic: F-statistic, which compares the variability between groups to the variability within groups.
P-value Interpretation: The probability of observing an F-statistic as extreme as or more extreme than the calculated value, assuming the null hypothesis of equal means is true.
Common Misuse: Conducting multiple pairwise comparisons after a significant ANOVA without using appropriate post-hoc tests or adjustments for multiple testing.

Its critical values can be computed numerically.[^critical-values-f]

[^critical-values-f]: For an $F$-distribution with $d_1$ and $d_2$ degrees of freedom, the critical values can be computed as $\displaystyle F_c = \left( \frac{I_\star^{-1}}{1 - I_\star^{-1}} \right) \frac{d_2}{d_1}$ where $\displaystyle I_\star^{-1} = I_{1-\alpha}^{-1}\left(\frac{d_1}{2}, \frac{d_2}{2}\right)$.

Mention something about the ADF and KPSS tests and Monte Carlo estimates.

## Model selection using information criteria
{:.no_toc}

# Footnotes

* footnotes will be placed here. This line is necessary
{:footnotes}

# References

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
  <span class="ref-author-list">Henderson, R. (1916)</span>
  Note on Graduation by Adjusted Average. <i>Transactions of the American Society of Actuaries</i> <b>17</b>, 43–48.
  <a href="/files/time-series-zoo/Henderson (1916), Note on Graduation by Adjusted Average, Transactions of the American Society of Actuaries.pdf" target="_blank" class="button">pdf</a>
  <a href="https://archive.org/details/transactions17actuuoft/page/42/mode/2up" target="_blank" class="button">source</a>
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

<div id="nandy2021">
  <span class="ref-author-list">Nandy, D. (2021).</span>
  Progress in Solar Cycle Predictions: Sunspot Cycles 24–25 in Perspective. <i>Solar Physics</i> <b>296</b>, 54.
  <a href="https://doi.org/10.1007/s11207-021-01797-2" target="_blank" class="button">doi</a>
</div>

<div id="shiskin1967">
  <span class="ref-author-list">Shiskin, J., Young, A. H., & Musgrave, J. C. (1967).</span>
  The X-11 Variant of the Census Method II Seasonal Adjustment Program. Technical Paper 15 (revised). <i>US Department of Commerce, 
Bureau of the Census, Washington, DC.</i>
  <a href="https://www.census.gov/library/working-papers/1967/adrm/shiskin-01.html" target="_blank" class="button">url</a>
  <a href="https://www.census.gov/content/dam/Census/library/working-papers/1967/adrm/shiskinyoungmusgrave1967.pdf" target="_blank" class="button">pdf</a>
</div>


<div id="wolter2011">
  <span class="ref-author-list">Wolter, K. & Timlin, M. S. (2011).</span>
  El Niño/Southern Oscillation behaviour since 1871 as diagnosed in an extended multivariate ENSO index (MEI.ext). <i>International Journal of Climatology</i> <b>31</b>, 1074-1087.
  <a href="https://doi.org/10.1002/joc.2336" target="_blank" class="button">doi</a>
</div>

</div>