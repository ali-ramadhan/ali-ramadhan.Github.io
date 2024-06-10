---
layout: post
title: "Touring a mini-zoo of time series and forecasting methods"
enable_mathjax: true
---

1. Do not remove this line (it will not be displayed)
{:toc}


# What are we even doing?

* Explain that forecasting is only possible by capturing the underlying process.
* Explain that we're doing one-shot learning and that some of these may benefit from external predictors.
* Also we want to make some $h$-horizon forecast and act on it.
* Explain that some can be used to make longer-term forecasts (e.g. AR) while some are only good for short-term.

# The time series zoo

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

</div>