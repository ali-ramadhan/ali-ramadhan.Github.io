---
layout: "project-euler-post"
problem_number: 5
problem_name: "Smallest Multiple"
date: 2025-10-07
difficulty: 5
benchmark_file: "problem-0005"
benchmark_key: "n_20"
---

> $2520$ is the smallest number that can be divided by each of the numbers from $1$ to $10$ without any remainder.
>
> What is the smallest positive number that is evenly divisible by all of the numbers from $1$ to $20$?

We want to basically find the [lowest common multiple](https://en.wikipedia.org/wiki/Least_common_multiple) (LCM) of 1, 2, ..., 20. Since $\operatorname{lcm}(a, b) = \operatorname{lcm}(b, a)$ and $\operatorname{lcm}(a, b, c) = \operatorname{lcm}(a, \operatorname{lcm}(b, c))$ we can iteratively compute the LCM using

```julia
function smallest_multiple(n)
    result = 1
    for i in 2:n
        result = lcm(result, i)
    end
    return result
end
```

where the Julia [`lcm` function](https://docs.julialang.org/en/v1/base/math/#Base.lcm) computes the LCM using

```math
\operatorname{lcm}(a, b) = \frac{|ab|}{\operatorname{gcd}(a, b)}
```

and where $\operatorname{gcd}(a, b)$ is the [greatest common divisor](https://en.wikipedia.org/wiki/Greatest_common_divisor) (GCD) of $a$ and $b$. Julia's [`gcd` function](https://docs.julialang.org/en/v1/base/math/#Base.gcd) computes the GCD using the [binary GCD algorithm](https://en.wikipedia.org/wiki/Binary_GCD_algorithm).

Computing `smallest_multiple(20)` is then done very quickly in just @benchmark[problem-0005:n_20].

The result grows very quickly with `smallest_multiple(42)` being the largest that does not overflow `Int64`, returning 219060189739591200 in @benchmark[problem-0005:n_42].

`smallest_multiple(88)` is the largest that does not overflow `Int128`, returning 8076030954443701744994070304101969600 in @benchmark[problem-0005:n_88_i128].

We can keep going past 88 using `BigInt`. Going all the way to `smallest_multiple(BigInt(100000))` returns a 43452-digit number in @benchmark[problem-0005:n_100k_bigint].
