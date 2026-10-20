---
layout: "project-euler-post"
problem_number: 9
problem_name: "Special Pythagorean Triplet"
date: 2025-11-30
benchmark_file: "problem-0009"
benchmark_key: "n_1e3_search"
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

@code[problem-0009:find_pythagorean_triplets_search]

This code finds the special Pythagorean triplet for $n = 10^3$ in @benchmark[problem-0009:n_1e3_search] after which we can easily compute $abc$ to solve the problem.

Taking it a bit further, we find two Pythagorean triplets for $n = 10^6$ in @benchmark[problem-0009:n_1e6_search]: $(200000, 375000, 425000)$ and $(218750, 360000, 421250)$.

And even further, we find three Pythagorean triplets for $n = 10^9$ in @benchmark[problem-0009:n_1e9_search]: $(23437500, 488000000, 488562500)$, $(200000000, 375000000, 425000000)$, and $(218750000, 360000000, 421250000)$.

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

This finds the same three triplets for $P = 10^9$ in just @benchmark[problem-0009:n_1e9_euclid]. It does $P = 10^3$ in @benchmark[problem-0009:n_1e3_euclid] and $P = 10^6$ in @benchmark[problem-0009:n_1e6_euclid].

The time complexity is roughly $\mathcal{O}(\sqrt{P} \cdot d(P))$ where $d(P)$ is related to the divisor structure of $P$.

## An even faster approach by factoring the perimeter

The Euclid approach still loops over every $m$ up to $\sqrt{P/2}$, even though only a few of them divide $P/2$. It turns out we can skip the search entirely. If we square the perimeter and replace $a^2 + b^2$ with $c^2$ we get

```math
P^2 = (a + b + c)^2 = a^2 + b^2 + c^2 + 2ab + 2bc + 2ca = 2(c^2 + ab + bc + ca) = 2(a + c)(b + c)
```

So if we let $x = b + c$ and $y = a + c$, then every Pythagorean triplet with perimeter $P$ gives a factorization

```math
xy = \frac{P^2}{2}
```

and we can get the triplet back from $x$ and $y$ since $a = P - x$, $b = P - y$, and $c = x + y - P$. This also tells us that $P$ has to be even.

Not every factorization gives a triplet though. We need $a < b$, which means $y < x$, and since $xy = P^2/2$ that's the same as $x > P/\sqrt{2}$. We also need $a > 0$, which means $x < P$. Going the other way, any divisor $x$ of $P^2/2$ with $P/\sqrt{2} < x < P$ gives a triplet because

```math
a^2 + b^2 - c^2 = (P - x)^2 + (P - y)^2 - (x + y - P)^2 = P^2 - 2xy = 0
```

So the Pythagorean triplets with perimeter $P$ are exactly the divisors of $P^2/2$ between $P/\sqrt{2}$ and $P$.

This idea comes from the [Project Euler forum thread](https://projecteuler.net/thread=9) for this problem. [sivoh](https://projecteuler.net/thread=9;page=2#3914) found the triplet back in 2006 by listing the divisors of $500{,}000$ and picking out the ones in the right range, and [tpoulin000](https://projecteuler.net/thread=9;page=8#455614) used the same substitution with $x$ and $y$ swapped. Dean Hickerson gave a similar divisor count for primitive triplets in [OEIS A078926](https://oeis.org/A078926), and the number of triplets for each perimeter is [OEIS A024155](https://oeis.org/A024155).

To find all the triplets for any $P$ we can factor $P$, which gives us the factorization of $P^2/2$ for free: each exponent doubles, and dividing by $2$ lowers the exponent of $2$ by one. Then we build up the divisors of $P^2/2$ one prime at a time, only keeping the ones below $P$, and check which ones are bigger than $P/\sqrt{2}$. To factor $P$ we can reuse `prime_factors` from [Problem 3](/blog/project-euler/problem-0003/), which uses trial division.

@code[problem-0009:find_pythagorean_triplets_divisors]

Since $P^2$ overflows `Int64` once $P$ gets past $\sqrt{2^{63}}, we compute it with `widemul`, which returns an `Int128`. Then $y = P^2/(2x)$ fits back into an `Int` since it's less than $P/\sqrt{2}$. Computing $c = x + y - P$ is fine too, even though $x + y$ overflows when $P$ is close to `typemax(Int)`. `Int` arithmetic wraps around modulo $2^{64}$, so subtracting $P$ undoes the overflow, and $c$ itself always fits.

This finds the three triplets for $P = 10^9$ in @benchmark[problem-0009:n_1e9_divisors], which is @ratio[problem-0009:n_1e9_euclid/n_1e9_divisors] faster than the Euclid approach, and it does $P = 10^6$ in @benchmark[problem-0009:n_1e6_divisors]. For $P = 10^3$ it takes @benchmark[problem-0009:n_1e3_divisors], which is actually @ratio[problem-0009:n_1e3_divisors/n_1e3_euclid] slower than the Euclid approach, since that only has to try a few values of $m$.

Some of the speedup at $P = 10^9$ comes from powers of ten being an easy case for this approach. Trial division divides out the $2$s and $5$s and stops, while the Euclid approach has extra work to do because of all the divisors.

As we saw in [Problem 3](/blog/project-euler/problem-0003/), trial division is fast when $P$ only has small prime factors, but if $P$ has two large prime factors then it has to work its way up to the second largest one. About the hardest case near $10^9$ is $P = 999760166 = 2 \times 22349 \times 22367$, where $P/2$ is the product of the two consecutive primes on either side of $\sqrt{P/2}$, so trial division has to test a lot of numbers. It has a single triplet, $(804564, 499477477, 499478125)$, which the divisor approach finds in @benchmark[problem-0009:n_1e9_hard_divisors] and the Euclid approach finds in @benchmark[problem-0009:n_1e9_hard_euclid], so here it's only @ratio[problem-0009:n_1e9_hard_euclid/n_1e9_hard_divisors] faster.

For smooth $P$ like powers of ten, the gap keeps growing with $P$: the divisor approach finds all seven triplets for $P = 10^{18}$ in @benchmark[problem-0009:n_1e18_divisors], while the Euclid approach would have to try hundreds of millions of values of $m$.

In the worst case, when $P/2$ is prime, trial division takes $\mathcal{O}(\sqrt{P})$ time, which is no better than the Euclid approach. But for most $P$ it's much faster, and once $P$ is factored, generating the divisors only takes $\mathcal{O}(d(P^2/2))$ time where $d(n)$ is the number of divisors of $n$.
