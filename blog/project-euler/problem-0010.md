---
layout: "project-euler-post"
problem_number: 10
problem_name: "Summation of Primes"
date: 2025-12-05
benchmark_file: "problem-0010"
benchmark_key: "sum_of_primes_below_2M"
---

> The sum of the primes below $10$ is $2 + 3 + 5 + 7 = 17$.
>
> Find the sum of all the primes below two million.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler010/problem) asks for the sum of the primes up to any $N \leqslant 10^6$, with up to $10^4$ queries per run.
:::

This is a perfect problem to solve using the [Sieve of Eratosthenes](https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes), and Wikipedia has a great animation showing how it works.

Usually the sieve stores a boolean for every integer up to the limit, but we can cut memory usage in half because 2 is the only even prime. Instead of storing all integers, we'll just store odd numbers. Then array index $i$ represents the odd number $2i + 1$, and an odd number $n$ maps to index $(n - 1) / 2$.

The sieving logic also changes slightly. When we find a prime $p$ at index $i$, we mark its odd multiples as composite. Since $p^2$ is odd (odd times odd), we start there. The next odd multiple is $p^2 + 2p$, then $p^2 + 4p$, etc. In terms of array indices, consecutive odd multiples are spaced $p$ apart.

@code[src/utils/Primes/sieve.jl:_sieve_of_eratosthenes]

The internal `_sieve_of_eratosthenes` returns the boolean array directly, allowing us to build different functions on top of it. For this problem we only need the sum so we can avoid allocating a primes array by summing directly from the boolean array:

@code[src/utils/Primes/sieve.jl:sum_sieve_of_eratosthenes]

With this we can compute the sum of all primes below $2 \times 10^6$ in @benchmark[problem-0010:sum_of_primes_below_2M] using @benchmark[problem-0010:sum_of_primes_below_2M:memory].

We can go a bit further and compute the sum of all primes below $2 \times 10^8$ in @benchmark[problem-0010:sum_of_primes_below_200M] using @benchmark[problem-0010:sum_of_primes_below_200M:memory].

The sieve uses $\mathcal{O}(n/2)$ space for the boolean array. For time complexity, consider how much work we do crossing off multiples. For each prime $p$, we cross off roughly $n/2p$ odd multiples. The total work is

```math
\frac{n}{2 \cdot 3} + \frac{n}{2 \cdot 5} + \frac{n}{2 \cdot 7} + \cdots = \frac{n}{2} \left( \frac{1}{3} + \frac{1}{5} + \frac{1}{7} + \cdots \right).
```

The [sum of reciprocals of primes](https://en.wikipedia.org/wiki/Divergence_of_the_sum_of_the_reciprocals_of_the_primes) up to $n$ grows like $\log \log n$, giving us $\mathcal{O}(n \log \log n)$ time complexity.
