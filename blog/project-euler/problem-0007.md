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
> What is the $10\\,001$st prime number?

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler007/problem) replaces $10\\,001$ with any $N \leqslant 10^4$, with up to $10^3$ queries per run.
:::

## Trial division

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

## Counting primes instead of testing them

Trial division tests every number up to $p_n$, and a sieve would still have to go through every number up to $p_n$. For $n = 10^{12}$ that's a lot of numbers! But we don't have to look at every number below the $n$th prime if we can just count the primes up to some $x$ without listing them.

Then we can find $p_n$ by "aiming" at an $x$ a bit below $p_n$, counting the primes up to $x$ exactly to find out how many we're missing, then walking the (relatively) short distance from $x$ to $p_n$ with a sieve.

## Aiming with the logarithmic integral

The [prime-counting function](https://en.wikipedia.org/wiki/Prime-counting_function) $\pi(x)$ is the number of primes up to $x$. So for example $\pi(10) = 4$ because there are 4 primes below 10: 2, 3, 5, and 7. It's useful to note that $\pi(p_n) = n$, so any good estimate of $\pi(x)$ is also an estimate of $p_n$.

By the prime number theorem a number near $t$ is prime with probability about $1/\ln t$. Gauss's idea was to add up these probabilities for all the numbers up to $x$, which gives the [logarithmic integral](https://en.wikipedia.org/wiki/Logarithmic_integral_function)

```math
\pi(x) \approx \operatorname{li}(x) = \int_0^x \frac{dt}{\ln t}
```

where the integral passes over $t = 1$ as a [Cauchy principal value](https://en.wikipedia.org/wiki/Cauchy_principal_value). It's a pretty good estimate! Here it is next to the true counts from [OEIS A006880](https://oeis.org/A006880):

| $x$       | $\pi(x)$       | $\operatorname{li}(x)$ |
| --------- | -------------- | ---------------------- |
| $10^3$    | 168            | 177.6                  |
| $10^6$    | 78,498         | 78,627.5               |
| $10^9$    | 50,847,534     | 50,849,235.0           |
| $10^{12}$ | 37,607,912,018 | 37,607,950,280.8       |

To compute it we can use the series

```math
\operatorname{li}(x) = \gamma + \ln \ln x + \sum_{k=1}^\infty \frac{(\ln x)^k}{k \cdot k!}
```

where $\gamma \approx 0.5772$ is the [Euler–Mascheroni constant](https://en.wikipedia.org/wiki/Euler%27s_constant). To see where it comes from, substitute $t = e^u$. This turns the logarithmic integral into the [exponential integral](https://en.wikipedia.org/wiki/Exponential_integral) $\operatorname{Ei}$ evaluated at $\ln x$,

```math
\operatorname{li}(x) = \operatorname{Ei}(\ln x) = \int_{-\infty}^{\ln x} \frac{e^u}{u} \, du
```

Expanding $e^u = 1 + u + u^2/2! + u^3/3! + \cdots$ and dividing by $u$ gives $1/u + 1 + u/2! + u^2/3! + \cdots$, which we can integrate term by term to get $\ln u + u + u^2/(2 \cdot 2!) + u^3/(3 \cdot 3!) + \cdots$. At $u = \ln x$ that's the series above, apart from the constant of integration. Pinning down the constant takes more care, because the integral starts at $-\infty$ and passes through $u = 0$, but it turns out to be exactly $\gamma$ @citep[temme2010, eqs. 6.2.8 and 6.6.1].

For $x > 1$ every term is positive, so we can just keep adding terms until they're too small to change the sum:

@code[src/utils/Primes/prime_counting.jl:logarithmic_integral]

To aim at $p_n$ we have to go the other way and solve $\operatorname{li}(x) = n$ for $x$. The derivative of $\operatorname{li}(x)$ is just $1/\ln x$, so each step of [Newton's method](https://en.wikipedia.org/wiki/Newton%27s_method) is

```math
x_{k+1} = x_k + \big(n - \operatorname{li}(x_k)\big) \ln x_k
```

Starting from $x_0 = n \ln n$, the prime number theorem's rough guess for $p_n$, it converges in a handful of steps. We stop once a step is no smaller than the one before it, since from then on we'd just be bouncing around in the rounding error:

@code[src/utils/Primes/prime_counting.jl:inverse_logarithmic_integral]

For $n = 10{,}001$ this gives $\operatorname{li}^{-1}(10{,}001) = 104{,}281.3$, which is $462$ below the answer of $104{,}743$. For $n = 10^{12}$ it's $4{,}805{,}589$ below $p_{10^{12}} = 29{,}996{,}224{,}275{,}833$.

Both guesses are too low. Riemann noticed that $\operatorname{li}(x)$ is closer to a count that also includes the prime powers, $\pi(x) + \tfrac{1}{2}\pi(\sqrt{x}) + \tfrac{1}{3}\pi(\sqrt[3]{x}) + \cdots$, so it overestimates $\pi(x)$ by roughly $\tfrac{1}{2}\pi(\sqrt{x}) \approx \sqrt{x}/\ln x$. Since $\operatorname{li}(x) > \pi(x)$, solving $\operatorname{li}(x) = n$ lands below $p_n$. @citet[buthe2018] proved that $\operatorname{li}(x) > \pi(x)$ for every $2 \leq x \leq 10^{19}$, which covers every prime that fits in an `Int64`, so we only ever have to walk upwards from our aim. It doesn't last forever though: @citet[littlewood1914] proved that $\pi(x)$ overtakes $\operatorname{li}(x)$ infinitely often. Nobody knows where it first happens, only that it's somewhere between $10^{19}$ and about $1.4 \times 10^{316}$ @citep[saouter2015].

Riemann also found a better estimate that takes the prime powers back out, his [$R$ function](https://en.wikipedia.org/wiki/Prime-counting_function#Exact_form), which starts $R(x) = \operatorname{li}(x) - \tfrac{1}{2}\operatorname{li}(\sqrt{x}) - \tfrac{1}{3}\operatorname{li}(\sqrt[3]{x}) - \cdots$. Aiming with $R^{-1}(n)$ bring us about four times closer for $n = 10^{12}$. But walking is the computationally cheap part, so we can just use the less accurate aim since it's simpler.

## Counting primes

Now for the hard part: counting the primes up to $x$ exactly without listing them. The trick, from [Lucy_Hedgehog's post](https://projecteuler.net/thread=10;page=5#111677) in the forum thread for [Problem 10](/blog/project-euler/problem-0010/), is to run the sieve of Eratosthenes on counts instead of on numbers. The post sums the primes, which is what Problem 10 asks for, but counting them works the same way.

Let $S(v, p)$ be how many of the numbers $2, 3, \dots, v$ are still standing after crossing off the multiples of every prime up to $p$ (but not the primes themselves). Those are the primes, plus the composites whose prime factors are all bigger than $p$. Before any sieving, $S(v, 1) = v - 1$.

Sieving by the next prime $p$ crosses off the composites whose smallest prime factor is $p$. Each of them is $p \cdot m$ for some $m \leq v/p$ with no prime factor below $p$, which means $m$ survived sieving by the primes below $p$. There are $S(\lfloor v/p \rfloor, p - 1)$ such survivors. But the survivors below $p$ are just the primes below $p$, and $p$ times one of those was already crossed off by that smaller prime. Taking those away, sieving by $p$ leaves

```math
S(v, p) = S(v, p - 1) - \Big[S\big(\lfloor v/p \rfloor, p - 1\big) - \pi(p - 1)\Big]
```

for $v \geq p^2$, while smaller $v$ don't change since the first number $p$ crosses off is $p^2$. After sieving by every prime up to $\sqrt{x}$ only the primes are left standing, so $S(x, \sqrt{x}) = \pi(x)$.

For example, we can count the primes up to $100$ by starting from $S(100, 1) = 99$ and sieving by $2$, $3$, $5$ and $7$:

| Sieving by | Crossed off                       | Which ones               | Left |
| ---------- | --------------------------------- | ------------------------ | ---- |
| 2          | $S(50, 1) - \pi(1) = 49 - 0 = 49$ | $4, 6, 8, \dots, 100$    | 50   |
| 3          | $S(33, 2) - \pi(2) = 17 - 1 = 16$ | $9, 15, 21, \dots, 99$   | 34   |
| 5          | $S(20, 4) - \pi(4) = 8 - 2 = 6$   | $25, 35, 55, 65, 85, 95$ | 28   |
| 7          | $S(14, 6) - \pi(6) = 6 - 3 = 3$   | $49, 77, 91$             | 25   |

which leaves the $\pi(100) = 25$ primes.

The other trick is noticing which values of $v$ we need. Since $\lfloor \lfloor x/k \rfloor / p \rfloor = \lfloor x/(kp) \rfloor$, starting from $x$ we only ever need $S$ at values of the form $\lfloor x/k \rfloor$. There are at most $2\sqrt{x}$ of those, one for each $k \leq \sqrt{x}$ and the rest all below $\sqrt{x}$. For $x = 100$ there are only $19$ of them: $100, 50, 33, 25, 20, 16, 14, 12, 11, 10$ and $1, 2, \dots, 9$.

So `prime_pi` keeps $S$ in two arrays, `small[v]` for $v$ up to $\sqrt{x}$ and `large[k]` for $v = \lfloor x/k \rfloor$, and updates them in place one prime at a time. It goes from the largest $v$ down, so that the $S(\lfloor v/p \rfloor, p - 1)$ it reads hasn't been updated for $p$ yet. The counts also tell us which $p$ are prime, since $p$ is prime exactly when $S(p) > S(p - 1)$:

@code[src/utils/Primes/prime_counting.jl:prime_pi]

Each prime $p \leq \sqrt{x}$ updates every stored $v \geq p^2$, which adds up to $\mathcal{O}(x^{3/4})$ time, and the two arrays take $\mathcal{O}(\sqrt{x})$ memory.

This is a simple relative of the [Meissel–Lehmer algorithm](https://en.wikipedia.org/wiki/Meissel%E2%80%93Lehmer_algorithm). The fastest algorithms of this kind, by Deléglise and Rivat and by Gourdon, take about $x^{2/3}$ time, and Kim Walisch's [primecount](https://github.com/kimwalisch/primecount) has highly optimized implementations of them.

## Walking to the $n$th prime

After counting, we know exactly how many primes are still missing: $n - \pi(x)$. Primes near $x$ are about $\ln x$ apart, so the missing primes should take up about $(n - \pi(x)) \ln x$ numbers above $x$. We sieve a window twice that long and, in the unlikely case that it comes up short, keep sieving more windows. The windowed `sieve_of_eratosthenes(lo, hi)` only crosses off the multiples of the primes up to $\sqrt{\text{hi}}$ that land inside the window, since every composite in the window has a prime factor that small. Putting everything together:

@code[problem-0007:find_nth_prime_counting]

For $n = 10{,}001$ we aim at $x = 104{,}281$ and count $\pi(x) = 9{,}958$, so there are only $43$ more primes to walk past. `find_nth_prime_counting(10_001)` returns $104{,}743$ in @benchmark[problem-0007:counting_n_10001], which is @ratio[problem-0007:n_10001/counting_n_10001] faster than trial division. The gap only grows with $n$: the millionth prime takes @benchmark[problem-0007:counting_n_1M] instead of @benchmark[problem-0007:n_1M], and the billionth prime, $22{,}801{,}763{,}489$, takes @benchmark[problem-0007:counting_n_1B].

For $n = 10^{12}$ we aim at $x = 29{,}996{,}219{,}470{,}244$ and count $\pi(x) = 999{,}999{,}845{,}306$, which leaves $154{,}694$ primes to walk past in a window of about $10$ million numbers. `find_nth_prime_counting(10^12)` returns $29{,}996{,}224{,}275{,}833$ in @benchmark[problem-0007:counting_n_1T], which agrees with [OEIS A006988](https://oeis.org/A006988). Almost all of that time is spent in `prime_pi`, which is why a better aim wouldn't help much.

Counting costs $\mathcal{O}(x^{3/4})$ with $x \approx p_n$, which is roughly the square root of the $\mathcal{O}(p_n^{3/2})$ that trial division costs. In exchange we have to allocate memory now: @benchmark[problem-0007:counting_n_1T:memory] for $n = 10^{12}$, mostly for the two arrays in `prime_pi`.

This is also how primecount finds the $n$th prime. It aims, counts the primes up to its aim with its $x^{2/3}$ algorithms, and sieves the rest of the way. For large $n$ it even aims with $R$ corrected using the first $512$ zeros of the [Riemann zeta function](https://en.wikipedia.org/wiki/Riemann_zeta_function).

## References

[[bibliography]]
