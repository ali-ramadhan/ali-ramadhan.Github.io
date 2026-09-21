---
layout: "project-euler-post"
problem_number: 16
problem_name: "Power Digit Sum"
date: 2025-12-07
benchmark_file: "problem-0016"
benchmark_key: "power_digit_sum_2_1000"
---

> $2^{15} = 32768$ and the sum of its digits is $3 + 2 + 7 + 6 + 8 = 26$.
>
> What is the sum of the digits of the number $2^{1000}$?

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler016/problem) raises the exponent from $1000$ to any $N \leqslant 10^4$, with up to $100$ queries per run.
:::

This is pretty easy. Just compute $2^{1000}$ using `BigInt` and sum its digits.

@code[problem-0016:sum_of_digits,power_digit_sum]

It computes the solution in @benchmark[problem-0016:power_digit_sum_2_1000].

Going a bit further, we find that the sum of the digits of $2^{10^6}$ is 1351546 in @benchmark[problem-0016:power_digit_sum_2_1M].
