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

# Trend-cycle decompositions

## Classical or naive decomposition

## X13-ARIMA-SEATS

X13-ARIMA-SEATS is an advanced and complex seasonal adjustment software package developed by the U.S. Census Bureau. It's the 13th and latest version of a software package used by the U.S. Census Bureau since the 1950's. The first version, Census Method I, was based off the work of [Macauley (1931)](#macauley1931) on smoothing time series.[^smoothing]

[^smoothing]: Smoothing is useful to reduce noise in time series and identify trends and seasonality, making it easier to visualize and forecast. Macauley emphasized the importance of not just relying on a simple moving average which has a few issues. It weighs data points in the averaging window equally when more recent points may be more relevant. It cannot be used at the endpoints. It tends to lag behind the original data. And it can be significantly impacted by outliers. The answer is to use a weighted moving average such as the Henderson moving average.

Census Method I was followed by Census Method II and eleven more experimental versions (X1, X2, ..., X11) and Census Method II-X11 [Shiskin et al. (1967)](#shiskin1967) was probably good enough to be used widely. But X11 did have a couple of major weak points. X11 produced poor seasonally adjusted data at the end of the time series which made it hard to assess and forecast the direction of short-term trends. At Statistics Canada [Dagum (1978)](#dagum1978) developed X11-ARIMA to combat this weakness by using an appropriate ARIMA model to forecast a bit beyond the end of the time series and backcast a bit before the start, thereby allowing us to use symmetric weighted moving averages over the entire time series. Later [Findley et al. (1998)](#findley1998) developed X12-ARIMA in which the ARIMA model includes regression variables (regARIMA) to capture deterministic components such as trading day effects (certain months have more trading days which can affect economic time series), moving holiday effects, and outliers.

X13-ARIMA-SEATS extends X12-ARIMA by offering the option of using SEATS (Seasonal Extraction in ARIMA Time Series) to fit the ARIMA model to the time series (so you can choose between X11 and SEATS). With SEATS, complex cyclic and seasonal components can be extracted using a combination of spectral analysis and regression techniques.

It's probably worth noting that X11 methods might do weird things when applied to non-economic time series (or is it just wasted?).

These methods are very detailed so much more could be said about methods derived from X11. For more of an overview I would refer to [Dagum & Bianconcini (Ch. 4, 2016)](#dagum2016). For a much more detailed description of the X11 method see [Ladiray & Quenneville (2001)](#ladiray2001), it's an entire book dedicated to describing the X11 method!

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
  <a href="https://archive.org/details/transactions17actuuoft/page/42/mode/2up" target="_blank" class="button">pdf</a>
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
  <a href="https://www.nber.org/books-and-chapters/smoothing-time-series" target="_blank" class="button">pdf</a>
  <a href="https://www.nber.org/books-and-chapters/smoothing-time-series" target="_blank" class="button">source</a>
</div>

</div>