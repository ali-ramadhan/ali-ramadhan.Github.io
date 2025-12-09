---
layout: "project-euler-post"
bonus_problem: true
bonus_problem_number: 3
problem_name: "Heegner"
date: 2025-12-07
---

> Among all non-square integers $n$ with absolute value not exceeding $10^3$, find the value of $n$ such that $\cos(\pi \sqrt n)$ is closest to an integer.

## Searching for the solution

This seems easy enough. We just compute $\cos(\pi \sqrt n)$ for all non-square integers $|n| <= 1000$ and keep track of which ones are closest to an integer.

First thing to notice is that when $n > 0$ then $\cos(\pi \sqrt n)$ just oscillates between $-1$ and $1$ but maybe it'll get close to an integer. When $n < 0$ we actually have

```math
\cos(\pi \sqrt n)
= \cos \left( \pi \sqrt{-|n|} \right)
= \cos \left( i \pi \sqrt{|n|} \right)
= \cosh \left(\pi \sqrt{|n|} \right)
= \frac{e^{\pi \sqrt n} + e^{-\pi \sqrt n}}{2}
```

which grows exponentially.

Seeing that $e^{\pi \sqrt{1000}} \approx 7 \times 10^{42}$ we will need at least 43 digits of precision and maybe a nice 32 digit buffer for the fractional part. 75 digits worth of precision requires $75 \log_2(10) \approx 249$ bits of precision which we'll round up to $250$. So `Float64` will not be enough and neither will 128-bit floats (which are provided by [QuadMath.jl](https://github.com/JuliaMath/Quadmath.jl) in Julia). We'll use `BigFloat` and calculate the precision required based on the limit we want to search up to.

```julia
function required_precision_bits(limit; fractional_digits=32)
    val = cosh(big(π) * sqrt(big(limit)))
    integer_digits = ceil(Int, log10(val))
    total_digits = integer_digits + fractional_digits
    return ceil(Int, total_digits * log2(10))
end
```

We can code then code up the search:

```julia
using Printf

function distance_to_nearest_integer(x)
    return abs(x - round(x))
end

function find_closest_cos_to_integer(limit)
    precision_bits = required_precision_bits(limit)
    @info "Using $precision_bits bits of precision for limit=$limit"

    setprecision(BigFloat, precision_bits) do
        results = Vector{Tuple{Int,BigFloat,BigFloat}}()  # (n, value, distance)

        for n in -limit:limit
            n == 0 && continue
            isqrt(abs(n))^2 == abs(n) && continue

            if n > 0
                val = cos(big(π) * sqrt(big(n)))
            else
                val = cosh(big(π) * sqrt(big(-n)))
            end

            dist = distance_to_nearest_integer(val)

            push!(results, (n, val, dist))
        end

        # Sort by distance
        sort!(results, by=x -> x[3])

        # Log the top 10
        @info "Top 10 values of n where cos(π√n) is closest to an integer:"
        for i in 1:min(10, length(results))
            n, val, dist = results[i]
            @info @sprintf("%d: n = %d, value ≈ %.10e, distance ≈ %.10e", i, n, val, dist)
        end

        return results[1][1]
    end
end
```

Going up to $n = 10^3$ requires 250 bits of precision and produces the correct answer in @benchmark[problem-bonus-heegner:n_1k].

Going up to $n = 10^6$ requires 4641 bits of precision and actually does not find a closer value after searching for @benchmark[problem-bonus-heegner:n_1M]!

## Just knowing the solution

There are nine [Heegner numbers](https://en.wikipedia.org/wiki/Heegner_number). I don't fully understand them and arriving at them seems quite nontrivial so I won't try to describe them, but they are related to [almost integers](https://en.wikipedia.org/wiki/Almost_integer).

The largest Heegner number, 163, leads to the almost integer

```math
e^{\pi \sqrt{163}} = 262537412640768743.99999999999925\ldots \approx 640320^3 + 744
```

Apparently this number is sometimes called the [Ramanujan constant](https://mathworld.wolfram.com/RamanujanConstant.html) even though it was probably not found by Ramanujan himself, although he did find others like $e^{\pi \sqrt{58}}$ which is also an almost integer.

The existence of this almost integer explains the connection between Heegner numbers and this bonus problem, and may explain why searching up to $n = 10^6$ did not produce any closer answers.
