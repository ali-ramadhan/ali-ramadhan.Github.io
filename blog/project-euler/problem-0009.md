---
layout: "project-euler-post"
problem_number: 9
problem_name: "Special Pythagorean Triplet"
date: 2025-11-30
benchmark_file: "problem-0009"
benchmark_key: "n_1000"
---

> A Pythagorean triplet is a set of three natural numbers, $a \lt b \lt c$, for which, $$a^2 + b^2 = c^2.$$
> For example, $3^2 + 4^2 = 9 + 16 = 25 = 5^2$.
> There exists exactly one Pythagorean triplet for which $a + b + c = 1000$.
> Find the product $abc$.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler009/problem) asks for the largest $abc$ over all triplets with $a + b + c = N$ for any $N \leqslant 3000$ (or $-1$ if there are none), with up to $3000$ queries per run.
:::

We'll solve the more general problem where $a + b + c = n$.

## A fast approach using some algebra

We're looking for three values but we have two constraints which we can use to avoid having to search for $b$ and $c$. When searching we can compute $c$ by solving $a + b + c = n$ for $c$ to get $c = n - a - b$.

We can substitute the equation for $c$ into $a^2 + b^2 = c^2$ to get $a^2 + b^2 = (n - a - b)^2$. Solving it for $b$ we get

```math
b = \frac{n(n - 2a)}{2(n - a)}
```

So now we can just iterate through possible values for $a$ and compute $b$ and $c$ directly, converting a search space problem potentially consisting of three nested for loops with $\mathcal{O}(n^3)$ time complexity into a single for loop taking $\mathcal{O}(n)$ time.

We can use the constraints $a < b < c$ and $a + b + c = n$ to place an upper limit on $a$: it cannot be larger than $a_\text{max} = \lfloor n/3 \rfloor$ otherwise $a + b + c$ would exceed $n$.

So we just need to iterate through values of $a$ until $a_\text{max}$. For each value of $a$ we can directly compute values for $b$ and $c$ and see if they satisfy all the constraints. If they do, we have found a Pythagorean triplet!

@code[problem-0009:find_pythagorean_triplets]

This code finds the special Pythagorean triplet for $n = 10^3$ in @benchmark[problem-0009:n_1000] after which we can easily compute $abc$ to solve the problem.

Taking it a bit further, we find two Pythagorean triplets for $n = 10^6$ in @benchmark[problem-0009:n_1000000]: $(200000, 375000, 425000)$ and $(218750, 360000, 421250)$.

And even further, we find seven Pythagorean triplets for $n = 1234567890$ in @benchmark[problem-0009:n_1234567890]: $(63080361, 584045440, 587442089)$, $(63627480, 583741485, 587198925)$, $(123456789, 548696840, 562414261)$, $(149857215, 532003644, 552707031)$, $(180721521, 511427440, 542418929)$, $(205761315, 493827156, 534979419)$, and $(258784215, 453576204, 522207471)$.

## A faster approach using Euclid's formula

The $\mathcal{O}(n)$ approach works well but for very large $n$ we can do better using [Euclid's formula](https://en.wikipedia.org/wiki/Pythagorean_triple#Generating_a_triple) for generating Pythagorean triples. It states that all primitive Pythagorean triples (those where $\gcd(a, b, c) = 1$) can be written as

```math
a = m^2 - n^2, \quad b = 2mn, \quad c = m^2 + n^2
```

where $m > n > 0$, $\gcd(m, n) = 1$, and $m - n$ is odd. All non-primitive triples are just integer multiples $k$ of primitive ones.

The perimeter $P$ of a triple generated this way is

```math
P = a + b + c = (m^2 - n^2) + 2mn + (m^2 + n^2) = 2m(m + n)
```

For a scaled triple with factor $k$, the perimeter becomes $P = 2km(m + n)$, which means $km(m + n) = P/2$.

Since $k \ge 1$ and $n \ge 1$, we have $m(m + n) \le P/2$. And since $n \ge 1$, this means $m(m + 1) \le P/2$, which implies $m^2 < P/2$, so $m < \sqrt{P/2}$. This is a much tighter bound than iterating $a$ up to $P/3$.

For each candidate $m$, if $m$ divides $P/2$ we can write

```math
\frac{P/2}{m} = k(m + n)
```

Call the left-hand side $R$. We then search for divisors of $R$ that could be $(m + n)$, which would make $k = R / (m + n)$. For each candidate, we compute $n = (m + n) - m$ and check the constraints required by Euclid's formula: $n$ must be positive, $n < m$, $m$ and $n$ must be coprime, and $m + n$ must be odd.

@code[problem-0009:find_pythagorean_triplets_euclid]

This finds the same seven triplets for $P = 1234567890$ in just @benchmark[problem-0009:n_1234567890_euclid]. It does $P = 10^3$ in @benchmark[problem-0009:n_1000_euclid] and $P = 10^6$ in @benchmark[problem-0009:n_1000000_euclid].

The time complexity is roughly $\mathcal{O}(\sqrt{P} \cdot d(P))$ where $d(P)$ is related to the divisor structure of $P$.
