---
layout: "project-euler-post"
problem_number: 21
problem_name: "Amicable Numbers"
date: 2025-12-15
benchmark_file: "problem-0021"
benchmark_key: "limit_10k"
---

> Let $d(n)$ be defined as the sum of proper divisors of $n$ (numbers less than $n$ which divide evenly into $n$).
>
> If $d(a) = b$ and $d(b) = a$, where $a \ne b$, then $a$ and $b$ are an amicable pair and each of $a$ and $b$ are called amicable numbers.
>
> For example, the proper divisors of $220$ are $1, 2, 4, 5, 10, 11, 20, 22, 44, 55$ and $110$; therefore $d(220) = 284$. The proper divisors of $284$ are $1, 2, 4, 71$ and $142$; so $d(284) = 220$.
>
> Evaluate the sum of all the amicable numbers under $10000$.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler021/problem) raises the limit from $10000$ to any $N \leqslant 10^5$, with up to $1000$ queries per run.
:::

Rather than computing the sum of proper divisors for each number individually, we can use a sieve to precompute them all at once. This runs in $O(n \log n)$ time rather than $O(n\sqrt{n})$ for the naive approach.

@code[src/utils/Divisors.jl:sum_proper_divisors_sieve]

The sieve works by iterating through each potential divisor $i$ and adding it to all of its multiples. This is similar to the Sieve of Eratosthenes we used in [Problem 10](/blog/project-euler/problem-0010/) but instead of marking composites, we accumulate divisor sums.

With the base sieve implemented, we can check for amicable pairs using simple array lookups. The one wrinkle is that a number under the limit can have a partner above it, beyond the end of the sieve, so for those we fall back to `sum_divisors`, which sums the divisors by trial division up to $\sqrt{b}$:

@code[problem-0021:sum_of_amicable_numbers]

Using this we compute the answer for limits up to $10^7$, tabulated below.

| Limit   | Sum         | Time                                |
|---------|-------------|-------------------------------------|
| $10^4$  |             | @benchmark[problem-0021:limit_10k]  |
| $10^5$  | 852,810     | @benchmark[problem-0021:limit_100k] |
| $10^6$  | 27,220,963  | @benchmark[problem-0021:limit_1M]   |
| $10^7$  | 649,734,295 | @benchmark[problem-0021:limit_10M]  |
