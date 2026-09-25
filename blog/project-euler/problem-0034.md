---
layout: "project-euler-post"
problem_number: 34
problem_name: "Digit Factorials"
date: 2026-09-24
benchmark_file: "problem-0034"
benchmark_key: "find_digit_factorial_divisors"
---

> $145$ is a curious number, as $1! + 4! + 5! = 1 + 24 + 120 = 145$.
>
> Find the sum of all numbers which are equal to the sum of the factorial of their digits.
>
> Note: As $1! = 1$ and $2! = 2$ are not sums they are not included.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler034/problem) asks for the sum of all numbers below $N \leqslant 10^5$ that _divide_ the sum of the factorials of their digits rather than equal it. So $19$ counts since $1! + 9! = 362881 = 19 \times 19099$.
:::

Let's write $f(n)$ for the sum of the factorials of the digits of $n$, so $f(145) = 1! + 4! + 5! = 145$ and $f(19) = 1! + 9!  = 362{,}881$. We'll solve the more general problem of finding all numbers $n$ that divide $f(n)$, meaning $f(n) = kn$ for some $k \in \mathbb{N}$. The original problem is then the case $k = 1$. Like both problem statements, we skip single-digit numbers, which trivially divide their own factorial.

$f(n)$ can be computed without allocating any memory if we use [`divrem`](https://docs.julialang.org/en/v1/base/math/#Base.divrem) to extract each digit:

@code[src/utils/Digits.jl:digit_factorial_sum]

Neither problem statement gives an upper limit so first we need to know where to stop. Every digit factorial is at least $1$ (since $0! = 1! = 1$) and at most $9! = 362{,}880$. So a $d$-digit number $n$ has $d \le f(n) \le d \cdot 9!$. If $n$ has $d$ digits then $10^{d-1} \le n$. A positive number can't divide a smaller positive number so we also have that $n \le f(n)$. Putting this all together we have that

```math
10^{d-1} \le n \le f(n) \le d \cdot 9!
```

The left side grows by a factor of $10$ with every extra digit while the right side only grows by $9!$, so this can only hold for small $d$. It holds for $d = 7$ but fails for $d = 8$. So no number with more than $7$ digits divides its digit factorial sum and every solution is at most $7 \cdot 9! = 2{,}540{,}160$.

The simplest solution is now to check every number up to $7 \cdot 9!$:

@code[problem-0034:MAX_DIGITS,search_numbers!]

This will be pretty fast. But 96% of that range is made up of 6- and 7-digit numbers, and there's a much better way to deal with those.

First, $f(n)$ doesn't care about the order of the digits: $145$, $154$, $415$, $451$, $514$, and $541$ all have $f(n) = 145$. So just like in [problem 30](/blog/project-euler/problem-0030/) we can look at multisets of digits instead of numbers. Even better, $0! = 1!$ so a $0$ contributes exactly what a $1$ does and we only need to draw digits from $1$ to $9$.

The number of multisets of size $k$ drawn from $n$ values is called the [multiset coefficient](https://en.wikipedia.org/wiki/Multiset#Counting_multisets)

```math
\left(\mkern-6mu\binom{n}{k}\mkern-6mu\right) = \binom{n + k - 1}{k}
```

This means there are $\left(\mkern-6mu\binom{9}{d}\mkern-6mu\right) = \binom{d + 8}{d}$ multisets of $d$ digits, which for $d = 7$ is $\left(\mkern-6mu\binom{9}{7}\mkern-6mu\right) = \binom{15}{7} = 6{,}435$ possible sums versus $1{,}540{,}160$ seven-digit numbers below our limit.

Second, we can work backwards from each sum to the few numbers that could divide it. In problem 30 each multiset had exactly one candidate: its sum. Here the number can be any divisor of the sum, so given a sum $S$ from a multiset of $d$ digits we're looking for $d$-digit numbers $n = S / k$. Since $10^{d-1} \le S / k < 10^d$, we can rearrange to write

```math
\frac{S}{10^d} < k \le \frac{S}{10^{d-1}} \le \frac{d \cdot 9!}{10^{d-1}}
```

For $d = 7$ the right-hand side is $2.54$ so $k$ is $1$ or $2$, and for $d = 6$ it's $21.7$ so $k \le 21$. So each sum leaves at most a handful of candidates $n = S / k$, although the number of candidates increases with smaller $d$.

To test a candidate $n$ we compute $f(n)$. If $f(n) = S$ then $f(n) = kn$, since $n = S / k$. So $n$ divides its digit factorial sum and is a solution. The digits of $n$ don't have to match the multiset we started from. We won't miss any solutions either: each one also shows up as a candidate from the multiset of its own digits.

For example, the multiset $\lbrace 9, 9, 9, 9, 9, 9, 9 \rbrace$ gives $S = 2{,}540{,}160$ with candidates $2{,}540{,}160$ and $1{,}270{,}080$. Since $f(2540160) = 869$ and $f(1270080) = 45{,}366$ neither is a solution, and two divisions have dealt with the whole multiset.

To build the multisets we pick their digits from $9$ downward, so each multiset shows up exactly once as a non-increasing list of digits. This order also lets us skip most of them. If the digits picked so far add up to $S$ and we're about to pick the digit $m$ with $r$ slots left to fill, including this one, then none of the remaining digits can exceed $m$ and the largest sum this branch can reach is $S + r \cdot m!$. A $d$-digit number can only divide a sum of at least $10^{d-1}$, so as soon as $S + r \cdot m! < 10^{d-1}$ we can abandon this branch along with every smaller choice of $m$. For 7 digits this leaves only the multisets with at least three 9s, since two 9s and five 8s only reach $2 \cdot 9! + 5 \cdot 8! = 927{,}360$. Their other four digits can be anything, so that's $\left(\mkern-6mu\binom{9}{4}\mkern-6mu\right) = 495$ multisets out of $\left(\mkern-6mu\binom{9}{7}\mkern-6mu\right) = 6{,}435$.

This early stop idea comes from two posts in the [Project Euler forum thread](https://projecteuler.net/thread=34) for this problem. [PierrotLeFou](https://projecteuler.net/thread=34;page=8#453769) enumerates the digits from large to small and breaks out of the loop once the sums fall below $10^{d-1}$, while [Jonny](https://projecteuler.net/thread=34;page=8#456005) orders the multisets so the sums grow and breaks out once they pass $10^d$. For the original problem both ends work, but here only the lower one does since a sum far above $10^d$ can still be $k$ times a $d$-digit number.

@code[problem-0034:search_sums!]

So why not do this for every number of digits? Because the range of $k$ explodes for short numbers. The two-digit multiset $\lbrace 1, 9 \rbrace$ has $S = 362{,}881$ and $k$ can be anything from $3{,}629$ to $36{,}288$, over $32{,}000$ candidates for a single multiset when there are only $90$ two-digit numbers in total.

To choose between the two searches we estimate how much work each one would do on the $d$-digit numbers. The direct search checks each number once, so its work is just how many $d$-digit numbers there are below $N$. That's $9 \cdot 10^{d-1}$ unless $N$ cuts the range short.

The multiset search works through $\left(\mkern-6mu\binom{9}{d}\mkern-6mu\right) = \binom{d + 8}{d}$ multisets and a multiset with sum $S$ allows up to $S / 10^{d-1}$ quotients. To estimate the total we need the average sum over all the multisets. None of the digits $1$ to $9$ is special when listing multisets, so each one appears $d/9$ times on average and the average sum is

```math
\bar{S} = \frac{d}{9} \left( 1! + 2! + \cdots + 9! \right) = 45{,}457 \, d
```

and the average number of quotients per multiset is $\bar{k} = \bar{S} / 10^{d-1}$. So the multiset search tries about $\left(\mkern-6mu\binom{9}{d}\mkern-6mu\right) \bar{k}$ quotients in total.

If $9 \cdot 10^{d-1} \le \left(\mkern-6mu\binom{9}{d}\mkern-6mu\right) \bar{k}$ then it'll be faster to do the direct search over every $d$-digit number. Otherwise it's faster to do the multiset search. It turns out we want to check numbers directly up to $4$ digits and switch to multisets at $5$.

@code[problem-0034:find_digit_factorial_divisors]

Running this with $N = 10^7$ to find every solution takes @benchmark[problem-0034:find_digit_factorial_divisors] and finds 14 numbers, none of which have more than 5 digits. Only two of them have $k = 1$ and their sum is the answer to the original problem.

Numbers equal to the sum of the factorials of their digits are called [factorions](https://en.wikipedia.org/wiki/Factorion), and there are only four of them in base 10. The numbers that divide the sum of the factorials of their digits are [OEIS A247227](https://oeis.org/A247227), which lists the single digits too for $23$ terms in total and confirms the sequence is finite.
