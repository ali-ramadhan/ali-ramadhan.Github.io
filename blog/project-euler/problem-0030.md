---
layout: "project-euler-post"
problem_number: 30
problem_name: "Digit Fifth Powers"
date: 2025-12-22
difficulty: 5
benchmark_file: "problem-0030"
benchmark_key: "digits5"
---

> Surprisingly there are only three numbers that can be written as the sum of fourth powers of their digits:
>
> ```math
> \begin{align}
>   1634 &= 1^4 + 6^4 + 3^4 + 4^4 \\
>   8208 &= 8^4 + 2^4 + 0^4 + 8^4 \\
>   9474 &= 9^4 + 4^4 + 7^4 + 4^4
> \end{align}
> ```
>
> As $1 = 1^4$ is not a sum it is not included.
>
> The sum of these numbers is $1634 + 8208 + 9474 = 19316$.
>
> Find the sum of all the numbers that can be written as the sum of fifth powers of their digits.

We'll solve the more general problem of finding all numbers that equal the sum of their digits raised to the $p^\text{th}$ power.

First, we need an upper bound. An $n$-digit number is at least $10^{n-1}$, but the maximum sum of $n$ digit powers is $n \times 9^p$. For solutions to exist, we need $n \times 9^p \geq 10^{n-1}$. For $p = 5$ that means we only need to check up to 6-digit numbers or 999,999.

```julia
function calculate_max_digits(power)
    n = 1
    while n * 9^power >= 10^(n - 1)
        n += 1
    end
    return n - 1
end
```

We actually don't need to check every number. Numbers like $4150$, $4105$, and $5140$ all give the same digit power sum since they contain the same digits. So we can just check unique combinations of digits (multisets).

For 6 digits chosen from 0-9 with replacement, there are $\binom{10 + 6 - 1}{6} = \binom{15}{6} = 5{,}005$ combinations. This is about 70x fewer candidates than brute force.

For each combination like $[0, 0, 1, 4, 5, 5]$, we compute the sum $s$ of digit powers. If $s$ equals some rearrangement of those digits, it's a solution. But instead of sorting the digits of $s$ and comparing, we just check if `digit_power_sum(s) == s`. If the digits of $s$ give back $s$ when we sum their powers, then $s$ is valid.

```julia
using Combinatorics: with_replacement_combinations

function digit_power_sum(n, power)
    s = 0
    while n > 0
        n, d = divrem(n, 10)
        s += d^power
    end
    return s
end

function find_digit_power_numbers(power)
    max_digits = calculate_max_digits(power)
    results = Set{Int}()

    for combo in with_replacement_combinations(0:9, max_digits)
        s = sum(d^power for d in combo)
        s < 2 && continue

        if digit_power_sum(s, power) == s
            push!(results, s)
        end
    end

    return collect(results)
end
```

We run this for $4 \le p \le 7$ and tabulate the timings below.

| $p  $ | Time                             |
|-------|----------------------------------|
| 4     | @benchmark[problem-0030:digits4] |
| 5     | @benchmark[problem-0030:digits5] |
| 6     | @benchmark[problem-0030:digits6] |
| 7     | @benchmark[problem-0030:digits7] |

For $p = 6$ we only find one:

```math
548834 = 5^6 + 4^6 + 8^6 + 8^6 + 3^6 + 4^6
```

but for $p = 7$ we find five:
```math
\begin{align}
  1741725 &= 1^7 + 7^7 + 4^7 + 1^7 + 7^7 + 2^7 + 5^7 \\
  4210818 &= 4^7 + 2^7 + 1^7 + 0^7 + 8^7 + 1^7 + 8^7 \\
  9800817 &= 9^7 + 8^7 + 0^7 + 0^7 + 8^7 + 1^7 + 7^7 \\
  9926315 &= 9^7 + 9^7 + 2^7 + 6^7 + 3^7 + 1^7 + 5^7 \\
  14459929 &= 1^7 + 4^7 + 4^7 + 5^7 + 9^7 + 9^7 + 2^7 + 9^7
\end{align}
```

These numbers are known as [narcissistic numbers](https://en.wikipedia.org/wiki/Narcissistic_number) and the ones we found agree with [MathWorld](https://mathworld.wolfram.com/NarcissisticNumber.html).

The algorithm runs in $\mathcal{O}\left(\binom{10+d-1}{d} \times d\right)$ time where $d$ is the maximum number of digits for the given power.
