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

ENSO is the El Niño-Southern Oscillation, the name scientists use for El Niño. The other part of the climate oscillation, the Southern Oscillation, is a see-saw shift in surface air pressure between the eastern and western halves of the Pacific. When pressure rises in the east, it falls in the west and vice versa. In the 1950's scientists realized that El Niño and the Southern Oscillation were parts of the same event. 

 The Multivariate ENSO Index (MEI) is a method used to characterize the intensity of an ENSO event using a single number. The MEI accounts for sea level pressure, zonal and meridional components of the surface wind, sea surface temperature, surface air temperature and cloudiness.

Those variations have an irregular pattern but do have some semblance of cycles.

## Durban temperature

## 

# Time series decomposition

<!-- In this section, show an example of an additive decomposition and another of a multiplicative decomposition. Also show the Fourier transform and the correlation between the components? -->

The idea with decomposing a time series $y_t$ is to write it as $y_t = S_t + T_t + R_t$ where $y_t$ is the data, $S_t$ is the seasonal component, $T_t$ is the trend-cycle component, and $R_t$ is the remainder component (sometimes called the irregular component), all at time $t$. This is called an additive decomposition, but you can also do a multiplicative decomposition where $y_t = S_t \times T_t \times R_t$.[^multiplicative-decomposition]

[^multiplicative-decomposition]: Why? If seasonality and irregular components vary with the magnitude of the signal.

Why do we want/need decompositions? Maybe we just need to inspect and forecast the trend and the seasonality just gets in the way. As we'll find out, seasonally adjusting a time series is not trivial. It can also be easier to make forecasts of the trend and seasonal components separately. What else?

A point to make and a test we can code/run? The different components should not be correlated!

## Classical or naive decomposition

In classical decomposition, we assume that the seasonal component is constant from year to year. For multiplicative seasonality, the m values that form the seasonal component are sometimes called the “seasonal indices”.

## X13-ARIMA-SEATS

[X13-ARIMA-SEATS](https://www.census.gov/data/software/x13as.html) is an advanced and complex seasonal adjustment open-source software package developed by the U.S. Census Bureau. It's the 13th and latest version of a software package used by the U.S. Census Bureau since the 1950's. The first version, Census Method I, was based off the work of [Macauley (1931)](#macauley1931) on smoothing time series.[^smoothing]

[^smoothing]: Smoothing is useful to reduce noise in time series and identify trends and seasonality, making it easier to visualize and forecast. Macauley emphasized the importance of not just relying on a simple moving average which has a few issues. It weighs data points in the averaging window equally when more recent points may be more relevant. It cannot be used at the endpoints. It tends to lag behind the original data. And it can be significantly impacted by outliers. The answer is to use a weighted moving average such as the Henderson moving average.[^henderson]

[^henderson]: The Henderson moving average or filter.

Census Method I was followed by Census Method II and eleven more experimental versions (X1, X2, ..., X11) until Census Method II-X11 [Shiskin et al. (1967)](#shiskin1967) was probably good enough to be used widely. But X11 did have a major weakness. X11 produced poor seasonally adjusted data at the end of the time series which made it hard to assess and forecast the direction of short-term trends. At Statistics Canada [Dagum (1978)](#dagum1978) developed X11-ARIMA to combat this weakness by using an appropriate ARIMA model to forecast a bit beyond the end of the time series and backcast a bit before the start, thereby allowing us to use symmetric weighted moving averages over the entire time series. Later [Findley et al. (1998)](#findley1998) developed X12-ARIMA in which the ARIMA model includes regression variables (so it's now called regARIMA) to capture deterministic components such as trading day effects (certain months have more trading days which can affect economic time series), moving holiday effects, and outliers. Once the deterministic components have been taken out, the time series is confusingly said to be <i>linearized</i>.

X13-ARIMA-SEATS extends X12-ARIMA by using SEATS (Seasonal Extraction in ARIMA Time Series) after the deterministic components have been taken out. SEATS takes the linearized time series and assumes that each component can be modeled as an ARIMA process. It does this by using the canonical decomposition which maximizes the variance of the irregular component while ensuring that the other components are uncorrelated. Once SEATS has identified an ARIMA model for each component, it uses the Wiener-Kolmogorov filter to actually estimate the components. The WK filter is designed to give the minimum mean square error (MMSE) estimates of the components. In other words, it tries to make the estimated components as close as possible to the "true" unobserved components. So X13-ARIMA pre-adjusts the time series then SEATS takes the linearized time series and does the decomposition. Another similar method is TRAMO-SEATS.[^tramo-seats]

[^tramo-seats]: TRAMO-SEATS is another method similar to X13-ARIMA-SEATS. TRAMO stands for Time Series Regression with ARIMA Noise, Missing Observations, and Outliers. It was developed at the Bank of Spain and is implemented by the [Demetra+](https://en.wikipedia.org/wiki/Demetra%2B) software package. It similarly accounts for calendar day effects and outliers and also uses SEATS for the decomposition.

In general, methods like X13-ARIMA-SEATS are very detailed and describing them in detail would take up an entire blog post at least. For more of an overview I would refer to [Dagum & Bianconcini (Ch. 4, 2016)](#dagum2016). If you want a much more detailed description of the X11 method see [Ladiray & Quenneville (2001)](#ladiray2001). It's an entire book dedicated to describing the X11 method!

It's probably worth noting that X11 methods are still mainly designed to work with quarterly or monthly time series.

## STL



# Stationarity and unit root tests

## Augmented Dickey-Fuller test

Let's talk about the Dickey-Fuller test, (obviously?) introduced by [Dickey & Fuller (1979)](#dickey1979).

A footnote about computing critical values of distributions.[^critical-values-t] [^critical-values-chi-squared] [^critical-values-f]

[^critical-values-t]: To compute the critical value $t_c$ for a $t$-distribution with $\nu$ degrees of freedom for the purpose of performing a $t$-test at a significance level of $\alpha$, you can use the formula $\displaystyle t_c = \sqrt{\frac{\nu}{I_{2\alpha}^{-1}(\frac{\nu}{2}, \frac{1}{2})} - \nu}$ where $I^{-1}$ is the inverse of the [_regularized incomplete beta function_](https://en.wikipedia.org/wiki/Beta_function#Incomplete_beta_function), implemented in Mathematica as [`InverseBetaRegularized`](https://reference.wolfram.com/language/ref/InverseBetaRegularized.html).

[^critical-values-chi-squared]: For a $\chi^2$ distribution the critical values can be computed as $\displaystyle \chi_\alpha^2 = Q^{-1}\left(\frac{k}{2}, \alpha\right)$ where $Q^{-1}$ is the inverse of the [_upper regularized gamma function_](https://en.wikipedia.org/wiki/Incomplete_gamma_function#Regularized_gamma_functions_and_Poisson_random_variables), implemented in Mathematica as [`InverseGammaRegularized`](https://reference.wolfram.com/language/ref/InverseGammaRegularized.html).

[^critical-values-f]: For an $F$-distribution with $d_1$ and $d_2$ degrees of freedom, the critical values can be computed as $\displaystyle F_c = \left( \frac{I_\star^{-1}}{1 - I_\star^{-1}} \right) \frac{d_2}{d_1}$ where $\displaystyle I_\star^{-1} = I_{1-\alpha}^{-1}\left(\frac{d_1}{2}, \frac{d_2}{2}\right)$.

This is only very tangentially related to the Dickey-Fuller test but I couldn't find this information online so I'm including it here.

Mention the exact kind of test. Move these footnotes to their own appendix? Link it to the ADF test more closely?

## Kwiatkowski–Phillips–Schmidt–Shin (KPSS) test

# Analyzing each time series

* Look at trend-cycle decompositions and stationarity for each time series.
* We're looking for something stationary to predict in each? Depends on the method I guess.

# Time series forecasting methods

## Exponential smoothing (Damped? Holt-Winters')

## Autoregressive?

## Moving average?

## ARIMA

## TBATS?

## Prophet

# Forecasting time series!

# What else can we do?

* Covariates.
* Multiple time series.

# Appendices

## General resources

online textbook, python book?

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

</div>