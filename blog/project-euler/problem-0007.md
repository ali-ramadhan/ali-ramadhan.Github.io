---
layout: "project-euler-post"
problem_number: 7
problem_name: "10 001st Prime"
date: 2025-10-09
benchmark_file: "problem-0007"
benchmark_key: "n_10001"
---

> By listing the first six prime numbers: $2, 3, 5, 7, 11$, and $13$, we can see that the $6$th prime is $13$.
>
> What is the $10\,001$st prime number?

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler007/problem) replaces $10\,001$ with any $N \leqslant 10^4$, with up to $10^3$ queries per run.
:::

If we knew the upper bound on which numbers to check up to and we didn't mind allocating a bunch of memory we could use the [Sieve of Eratosthenes](https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes). But we don't know the upper bound and want to solve this using no memory allocations.

So we'll just go through the natural numbers until we've counted enough prime numbers. The hard part is defining a fast `is_prime` function then. A simple yet decently fast method of checking whether a number $n$ is prime or not is to make sure it's not a multiple of 2 or 3, then we just need to check numbers of the form $6k \pm 1$ for all $k \ge 1$ up until $\sqrt{n}$:

@code[src/utils/Primes/trial_division.jl:is_prime]

This approach is known as [wheel factorization](https://en.wikipedia.org/wiki/Wheel_factorization) with a wheel of size 6. The `is_prime` function dispatches on a primality test type so that other tests (like [Miller–Rabin](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test)) can be swapped in, with trial division being the default:

@code[src/utils/Primes/Primes.jl:DEFAULT_PRIMALITY_TEST,is_prime]

Then finding the $n^\text{th}$ prime can be done with

@code[problem-0007:find_nth_prime]

Calling `find_nth_prime(10_001)` returns the solution in @benchmark[problem-0007:n_10001].

We also compute the 100,000th prime to be 1,299,709 in @benchmark[problem-0007:n_100k] and the 1,000,000th prime to be 15,485,863 in @benchmark[problem-0007:n_1M]. Both of these agree with [The PrimePages](https://t5k.org/lists/small/).

The `is_prime` function runs in $\mathcal{O}(\sqrt{n})$ time since it only checks divisors up to $\sqrt{n}$. For `find_nth_prime`, by the [prime number theorem](https://en.wikipedia.org/wiki/Prime_number_theorem) the $n$th prime asymptotically satisfies $p_n \sim n \ln n$. Since we check approximately $p_n$ candidates, each requiring $\mathcal{O}(\sqrt{p_n})$ work, the overall complexity is $\mathcal{O}(p_n^{3/2}) = O(n^{3/2} \ln^{3/2} n)$.
