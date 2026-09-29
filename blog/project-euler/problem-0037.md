---
layout: "project-euler-post"
problem_number: 37
problem_name: "Truncatable Primes"
date: 2026-09-28
benchmark_file: "problem-0037"
benchmark_key: "find_truncatable_primes_base10"
---

> The number $3797$ has an interesting property. Being prime itself, it is possible to continuously remove digits from left to right, and remain prime at each stage: $3797$, $797$, $97$, and $7$. Similarly we can work from right to left: $3797$, $379$, $37$, and $3$.
>
> Find the sum of the only eleven primes that are both truncatable from left to right and right to left.
>
> NOTE: $2$, $3$, $5$, and $7$ are not considered to be truncatable primes.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler037/problem) asks for the sum of the truncatable primes below any $N \leqslant 10^6$.
:::

Removing digits from the right of $3797$ leaves its _prefixes_ $379$, $37$ and $3$, and removing them from the left leaves its _suffixes_ $797$, $97$ and $7$. A prime is _right-truncatable_ if all of its prefixes are prime and _left-truncatable_ if all of its suffixes are prime. A truncatable prime is then a prime with at least two digits that is both.

We'll solve the more general problem of finding all the truncatable primes in any base $b$. The original problem is $b = 10$ and the HackerRank version adds up the ones below $N$.

The problem tells us there are only eleven truncatable primes but not how we know that. We could sieve the primes below $10^6$ like in [Problem 10](/blog/project-euler/problem-0010/) and check the prefixes and suffixes of every one. That will find all eleven, but we only know that $10^6$ is enough because we were told that. And unfortunately, no search up to a limit can rule out a truncatable prime with a hundred digits though. However, we can show that there are only eleven by construction!

## Growing the right-truncatable primes

The trick is to not search for truncatable primes but to construct all possible ones by growing the right-truncatable primes instead. Removing the last digit of a right-truncatable prime leaves another right-truncatable prime. So from any right-truncatable prime we can peel off one digit at a time to a one-digit prime, like $3797 \to 379 \to 37 \to 3$. Read backwards, that walk starts at $3$ and appends one digit at a time while staying prime. So the right-truncatable primes form a tree! The roots are $2$, $3$, $5$ and $7$, and the children of each prime are the primes we get by appending a digit to it.

Only four digits are worth appending. Like in [Problem 35](/blog/project-euler/problem-0035/), a prime with two or more digits can't end in an even digit or a $5$, so we only need to try $1$, $3$, $7$ and $9$. In base $b$ the roots are the primes below $b$, and the digits worth appending are the ones that share no factor with $b$.

We grow the whole tree breadth-first, using the array of primes found so far as its own queue. We start with the single-digit primes and go through each element of the array trying to construct right-truncatable primes. Each time we find one, we apprent it to the array. The first four steps try $21$, $23$, $27$ and $29$ after $2$, then $31$, $33$, $37$ and $39$ after $3$, and so on, leaving $23$, $29$, $31$, $37$, $53$, $59$, $71$, $73$ and $79$. So the primes are added in order and come out sorted.

@code[problem-0037:using Base.Checked,find_right_truncatable_primes]

We don't know how large the numbers will get ahead of time, so instead of constructing `MillerRabin` with the largest number we'll test like we did in Problem 35, `MillerRabin()` picks the fewest witnesses for each number as it goes. The arithmetic is done in whatever integer type `base` is, and `checked_mul` and `checked_add` throw an `OverflowError` instead of silently wrapping around.

Here's the part of the tree that grows from $7$, with the truncatable primes in red:

<pre style="font-family: 'Fira Code', monospace; line-height: 1.3;">
7
├── 71 ── 719 ── 7193 ── 71933 ── 719333
├── <span style="color: red;"><b>73</b></span>
│   ├── 733
│   │   ├── 7331
│   │   └── 7333 ── 73331
│   └── 739 ── 7393 ── 73939
│                      ├── 739391 ── 7393913 ── 73939133
│                      ├── 739393
│                      │   ├── 7393931
│                      │   └── 7393933
│                      ├── <span style="color: red;"><b>739397</b></span>
│                      └── 739399
└── 79 ── <span style="color: red;"><b>797</b></span>
</pre>

Maybe we shouldn't be surprised that the trees thin out and die. By the [prime number theorem](https://en.wikipedia.org/wiki/Prime_number_theorem) a number near $x$ is prime with probability roughly $1/\ln x$. But every child ends in $1$, $3$, $7$ or $9$ so it can't be divisible by $2$ or $5$, which makes it $10/4 = 2.5$ times more likely to be prime. Each right-truncatable prime has four potential children (in base $10$), so once $2.5/\ln x$ dips below a quarter each prime has fewer than one prime child on average. That happens when $\ln x > 10$, or roughly when $x > e^{10} \approx 22{,}000$, which is right where the tree stops growing: it has $16$ primes with $4$ digits but only $15$ with $5$.

## Checking the suffixes

The tree takes care of the prefixes, so all that's left is checking the suffixes. The suffixes of $p$ are $p \bmod 10$, $p \bmod 100$, $p \bmod 1000$ and so on, and we check the shortest ones first since they're the cheapest to test.

@code[problem-0037:is_left_truncatable,find_truncatable_primes]

For example, $3797$ passes since $7$, $97$ and $797$ are all prime, while its parent $379$ fails straight away since $9$ isn't prime.

This finds the eleven truncatable primes in @benchmark[problem-0037:find_truncatable_primes_base10]. Most of the @benchmark[problem-0037:find_truncatable_primes_base10:memory] it allocates comes from `MillerRabin()` choosing the witnesses for each number on the fly.

More importantly, this proves that there are only eleven truncatable primes. The tree contains all right-truncatable primes by construction and every truncatable prime is right-truncatable, so it's somewhere in the tree.

Growing the right-truncatable primes is an old idea discussed by early solutions such as those of [mvz](https://projecteuler.net/thread=37#1657) and [manishi](https://projecteuler.net/thread=37;page=5#159480).

The truncatable primes are [OEIS A020994](https://oeis.org/A020994), which includes the one-digit primes. The right- and left-truncatable primes are [OEIS A024770](https://oeis.org/A024770) and [OEIS A024785](https://oeis.org/A024785). How many of them have each number of digits is in [OEIS A050986](https://oeis.org/A050986) and [OEIS A050987](https://oeis.org/A050987). The $83$ right-truncatable primes and $4{,}260$ left-truncatable primes go back to at least @citet[angell1977], which [SidneyLyZhang](https://projecteuler.net/thread=37;page=7#450902) pointed out in the forum thread.

There are other ways to truncate a prime too. Removing a digit from either end at each step gives $149{,}677$ left-or-right-truncatable primes ([OEIS A137812](https://oeis.org/A137812)), and removing a digit from both ends at once gives $920{,}720{,}315$ primes ([OEIS A077390](https://oeis.org/A077390)), the largest of which has $104$ digits.

## Other bases

Nothing we did depends on base $10$, and `find_truncatable_primes(base=b)` works in any base. The catch is how big the numbers get. We have to grow the whole tree, and in larger bases it gets much deeper even though the truncatable primes themselves stay small. `Int64` is enough for every base up to $16$ except $14$, while bases $17$ to $30$ all need `BigInt`.

Here are all the bases up to $30$, not counting the one-digit primes as truncatable. The counts match [OEIS A076586](https://oeis.org/A076586) and [OEIS A323390](https://oeis.org/A323390) (which counts the one-digit primes), and the largest truncatable primes match [OEIS A323137](https://oeis.org/A323137).

| $b$ | Right-truncatable primes | Truncatable primes | Largest truncatable prime | Its digits in base $b$ |
| --- | ------------------------ | ------------------ | ------------------------- | ---------------------- |
| 3   | 4                        | 1                  | 23                        | 3                      |
| 4   | 7                        | 1                  | 11                        | 2                      |
| 5   | 14                       | 3                  | 67                        | 3                      |
| 6   | 36                       | 6                  | 839                       | 4                      |
| 7   | 19                       | 4                  | 37                        | 2                      |
| 8   | 68                       | 18                 | 1,867                     | 4                      |
| 9   | 68                       | 4                  | 173                       | 3                      |
| 10  | 83                       | 11                 | 739,397                   | 6                      |
| 11  | 89                       | 2                  | 79                        | 2                      |
| 12  | 179                      | 30                 | 105,691                   | 5                      |
| 13  | 176                      | 6                  | 379                       | 3                      |
| 14  | 439                      | 31                 | 37,573                    | 4                      |
| 15  | 373                      | 11                 | 647                       | 3                      |
| 16  | 414                      | 16                 | 3,389                     | 3                      |
| 17  | 473                      | 6                  | 631                       | 3                      |
| 18  | 839                      | 62                 | 202,715,129               | 7                      |
| 19  | 1,010                    | 5                  | 211                       | 2                      |
| 20  | 1,577                    | 60                 | 155,863                   | 4                      |
| 21  | 2,271                    | 10                 | 1,283                     | 3                      |
| 22  | 2,848                    | 36                 | 787,817                   | 5                      |
| 23  | 1,762                    | 5                  | 439                       | 2                      |
| 24  | 3,376                    | 136                | 109,893,629               | 6                      |
| 25  | 5,913                    | 7                  | 577                       | 2                      |
| 26  | 6,795                    | 38                 | 4,195,880,189             | 7                      |
| 27  | 6,352                    | 11                 | 1,811                     | 3                      |
| 28  | 10,319                   | 68                 | 14,474,071                | 5                      |
| 29  | 5,866                    | 4                  | 379                       | 2                      |
| 30  | 14,639                   | 281                | 21,335,388,527            | 7                      |

The odd bases stand out: they have far fewer truncatable primes than the even bases, and never any primes with more than three digits. That's because in an odd base, a number is odd when its digit sum is odd. In a truncatable prime, every prefix and suffix with at least two digits is an odd prime, so its digit sum is odd. But with four or more digits, the first two digits (a prefix) and the rest (a suffix) would each have an odd digit sum, making the total even. So a truncatable prime in an odd base has at most three digits. Even bases don't have this problem since the parity of a number only depends on its last digit.

## References

[[bibliography]]
