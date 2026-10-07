---
layout: "project-euler-post"
problem_number: 5
problem_name: "Smallest Multiple"
date: 2025-10-07
benchmark_file: "problem-0005"
benchmark_key: "n_20"
---

> $2520$ is the smallest number that can be divided by each of the numbers from $1$ to $10$ without any remainder.
>
> What is the smallest positive number that is evenly divisible by all of the numbers from $1$ to $20$?

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler005/problem) raises the limit from $20$ to $N \leqslant 40$, with up to $10$ queries per run.
:::

## Computing the LCM iteratively

We want to basically find the [lowest common multiple](https://en.wikipedia.org/wiki/Least_common_multiple) (LCM) of 1, 2, ..., 20. Since $\operatorname{lcm}(a, b) = \operatorname{lcm}(b, a)$ and $\operatorname{lcm}(a, b, c) = \operatorname{lcm}(a, \operatorname{lcm}(b, c))$ we can iteratively compute the LCM using

@code[problem-0005:smallest_multiple]

where the Julia [`lcm` function](https://docs.julialang.org/en/v1/base/math/#Base.lcm) computes the LCM using

```math
\operatorname{lcm}(a, b) = \frac{|ab|}{\operatorname{gcd}(a, b)}
```

and where $\operatorname{gcd}(a, b)$ is the [greatest common divisor](https://en.wikipedia.org/wiki/Greatest_common_divisor) (GCD) of $a$ and $b$. Julia's [`gcd` function](https://docs.julialang.org/en/v1/base/math/#Base.gcd) computes the GCD using the [binary GCD algorithm](https://en.wikipedia.org/wiki/Binary_GCD_algorithm).

Computing `smallest_multiple(20)` is then done very quickly in just @benchmark[problem-0005:n_20].

We don't even need all of 1, 2, ..., 20. Any $k \leq 10$ can be doubled until it lands between 11 and 20, so $\operatorname{lcm}(1, 2, \dots, 20) = \operatorname{lcm}(11, 12, \dots, 20)$. We can't start any later than 11, since 11 has no other multiple up to 20. For general $n$ the latest starting point is [OEIS A188666](https://oeis.org/A188666).

## How big the answer gets

The answers to the general problem, $\operatorname{lcm}(1, 2, \dots, n) = 1, 2, 6, 12, 60, 60, 420, \dots$ are [OEIS A003418](https://oeis.org/A003418), and they grow very quickly with `smallest_multiple(42)` being the largest that does not overflow `Int64`, returning 219060189739591200 in @benchmark[problem-0005:n_42].

`smallest_multiple(Int128(88))` is the largest that does not overflow `Int128`, returning 8076030954443701744994070304101969600 in @benchmark[problem-0005:n_88_i128].

Why 42 and 88? The logarithm of $\operatorname{lcm}(1, 2, \dots, n)$ is the [second Chebyshev function](https://en.wikipedia.org/wiki/Chebyshev_function) $\psi(n)$, and the [prime number theorem](https://en.wikipedia.org/wiki/Prime_number_theorem) is equivalent to $\psi(n) \sim n$, so $\operatorname{lcm}(1, 2, \dots, n) \approx e^n$. `Int64` holds numbers up to $2^{63} \approx e^{43.7}$ and `Int128` up to $2^{127} \approx e^{88.0}$.

We can keep going past 88 using `BigInt`. Going all the way to `smallest_multiple(BigInt(100000))` returns a 43452-digit number in @benchmark[problem-0005:n_100k_bigint].

## Primorials

The [primorial](https://en.wikipedia.org/wiki/Primorial) $n\\#$ is the product of all the primes up to $n$,

```math
n\# = \prod_{p \leq n\atop p\,\text{prime}} p
```

so $20\\# = 2 \cdot 3 \cdot 5 \cdot 7 \cdot 11 \cdot 13 \cdot 17 \cdot 19 = 9699690$. The primorials $n\\# = 1, 2, 6, 6, 30, 30, 210, \dots$ are [OEIS A034386](https://oeis.org/A034386), and the products of the first $n$ primes $2, 6, 30, 210, 2310, \dots$ are [OEIS A002110](https://oeis.org/A002110). To compute $n\\#$ we can sieve the primes up to $n$ and multiply them together.

Primorials are useful here because $\operatorname{lcm}(1, 2, \dots, n)$ is built from them. The exponent of a prime $p$ in $\operatorname{lcm}(1, 2, \dots, n)$ is the largest $k$ with $p^k \leq n$, which is the number of $k \geq 1$ with $p \leq n^{1/k}$. So we can collect the primes in layers. The first layer has every prime up to $n$, the second every prime up to $\sqrt{n}$, the third every prime up to $\sqrt[3]{n}$, and so on:

```math
\operatorname{lcm}(1, 2, \dots, n) = n\# \cdot \lfloor \sqrt{n} \rfloor\# \cdot \lfloor \sqrt[3]{n} \rfloor\# \cdot \lfloor \sqrt[4]{n} \rfloor\# \cdots
```

The [GMP](https://gmplib.org/) library, which Julia's `BigInt` is built on, already has a fast primorial function, [`mpz_primorial_ui`](https://gmplib.org/manual/Number-Theoretic-Functions). [Its implementation](https://gmplib.org/repo/gmp/file/tip/mpz/primorial_ui.c) sieves the primes up to $n$ and packs as many as fit into each 64-bit word. It then multiplies the words together with a [binary splitting](https://gmplib.org/repo/gmp/file/tip/mpz/prodlimbs.c) product. Computing $\operatorname{lcm}(1, 2, \dots, n)$ is then just a handful of calls to it and a few multiplications.
