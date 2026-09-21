---
layout: "project-euler-post"
bonus_problem: true
bonus_problem_number: 3
problem_name: "Heegner"
date: 2025-12-07
difficulty_estimate: 10
benchmark_file: "bonus-heegner"
benchmark_key: "n_1k"
---

> Among all non-square integers $n$ with absolute value not exceeding $10^3$, find the value of $n$ such that $\cos(\pi \sqrt n)$ is closest to an integer.

## Searching for the solution

This seems easy enough. We just compute $\cos(\pi \sqrt n)$ for all non-square integers $|n| \le 1000$ and keep track of which ones are closest to an integer.

First thing to notice is that when $n > 0$ then $\cos(\pi \sqrt n)$ just oscillates between $-1$ and $1$ but maybe it'll get close to an integer. When $n < 0$ we actually have

```math
\cos(\pi \sqrt n)
= \cos \left( \pi \sqrt{-|n|} \right)
= \cos \left( i \pi \sqrt{|n|} \right)
= \cosh \left(\pi \sqrt{|n|} \right)
= \frac{e^{\pi \sqrt{|n|}} + e^{-\pi \sqrt{|n|}}}{2}
```

which grows exponentially.

Seeing that $\cosh \left( \pi \sqrt{1000} \right) \approx 7 \times 10^{42}$ we will need at least 43 digits of precision and maybe a nice 32 digit buffer for the fractional part. 75 digits worth of precision requires $75 \log_2(10) \approx 249$ bits of precision which we'll round up to $250$. So `Float64` will not be enough and neither will 128-bit floats (which are provided by [Quadmath.jl](https://github.com/JuliaMath/Quadmath.jl) in Julia). We'll use `BigFloat` and calculate the precision required based on the limit we want to search up to.

@code[bonus-heegner:required_precision_bits]

We can then code up the search. Each value of $n$ is independent so this is embarrassingly parallel: the range from $-\text{limit}$ to $\text{limit}$ is divided into one chunk per thread, each thread computes $\cos(\pi \sqrt n)$ and its distance to the nearest integer for its own chunk, and the results are concatenated and sorted by distance (with a plain loop as the fallback when Julia is started with a single thread):

@code[bonus-heegner:distance_to_nearest_integer,process_chunk,find_closest_cos_to_integer]

The top 10 are logged so we can see how close the runners-up get:

@code[bonus-heegner:using Printf,log_top_results]

Going up to $n = 10^3$ requires 250 bits of precision and produces the correct answer in @benchmark[bonus-heegner:n_1k] using all the threads on the machine.

Going up to $n = 10^6$ requires 4641 bits of precision and actually does not find a closer value after searching for @benchmark[bonus-heegner:n_1M]!

## Just knowing the solution

There are nine [Heegner numbers](https://en.wikipedia.org/wiki/Heegner_number). I don't fully understand them and arriving at them seems quite nontrivial so I won't try to describe them, but they are related to [almost integers](https://en.wikipedia.org/wiki/Almost_integer).

The largest Heegner number, 163, leads to the almost integer

```math
e^{\pi \sqrt{163}} = 262537412640768743.99999999999925\ldots \approx 640320^3 + 744
```

Apparently this number is sometimes called the [Ramanujan constant](https://mathworld.wolfram.com/RamanujanConstant.html) even though it was probably not found by Ramanujan himself, although he did find others like $e^{\pi \sqrt{58}}$ which is also an almost integer.

The existence of this almost integer explains the connection between Heegner numbers and this bonus problem, and may explain why searching up to $n = 10^6$ did not produce any closer answers.
