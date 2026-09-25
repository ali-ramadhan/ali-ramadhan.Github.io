---
layout: "project-euler-post"
problem_number: 35
problem_name: "Circular Primes"
date: 2026-09-25
benchmark_file: "problem-0035"
benchmark_key: "find_circular_primes_1M"
---

> The number, $197$, is called a circular prime because all rotations of the digits: $197$, $971$, and $719$, are themselves prime.
>
> There are thirteen such primes below $100$: $2, 3, 5, 7, 11, 13, 17, 31, 37, 71, 73, 79$, and $97$.
>
> How many circular primes are there below one million?

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler035/problem) asks for the sum of the circular primes below any $N \leqslant 10^6$ rather than their count, and notes that the rotations themselves are allowed to exceed $N$.
:::

We'll solve the more general problem of finding all circular primes below $N$. The original problem asks how many there are for $N = 10^6$ and the HackerRank version asks for their sum.

Rotating the digits of a number doesn't need any strings. If $n$ has $d$ digits then `divrem(n, 10^(d-1))` splits off its leading digit from the rest, and moving that digit to the end is a multiply and an add:

@code[src/utils/Digits.jl:rotate_digits]

We pass in $d$ rather than computing it from $n$ so that a leading zero left behind by an earlier rotation still counts as a digit, although we're about to see that no zeros will show up here.

The obvious way to solve this is to sieve the primes below $10^6$ like in [Problem 10](/blog/project-euler/problem-0010/), then rotate every prime and look its rotations up in the sieve. That takes a couple of milliseconds and there's nothing wrong with it. But almost all of that work goes into numbers that could never be circular primes, and will use too much memory if we want to go much further than $10^6$.

To trim down the number of candidates to check, we notice that a circular prime with more than one digit cannot have any even digits or a 5 anywhere, otherwise one of the rotations will be divisible by 2 or 5 and thus not prime. For numbers with $d$ digits that leaves us with $4^d$ candidates instead of $9 \cdot 10^{d-1}$ which is nice.

To enumerate the candidates we can write $k = 0, 1, \dots, 4^d - 1$ in base $4$ and relabel its digits $0, 1, 2, 3 \to 1, 3, 7, 9$. For $d = 3$, $k = 0$ is $000_4$ and becomes $111$, $k = 1$ is $001_4$ and becomes $113$, $k = 4$ is $010_4$ and becomes $131$, and so on up to $k = 63$ which is $333_4$ and becomes $999$. The candidates come out in increasing order and we can stop as soon as one reaches $N$.

@code[problem-0035:CIRCULAR_DIGITS,candidate]

We can think of the rotations as splitting the candidates into groups we'll call rotation classes. For example, the group of $197$ is $\lbrace 197, 971, 719 \rbrace$ and the group of $11$ is just $\lbrace 11 \rbrace$. It turns out that combinatorics (of course) already has a name for these: they're [necklaces](https://en.wikipedia.org/wiki/Necklace_%28combinatorics%29), as in beads on a loop that look the same however you rotate it. Either every member of a rotation class is a circular prime or none of them is. This means the primality tests, which are the only expensive part of this problem, only need to happen once per class. So for example for $\lbrace 197, 971, 719 \rbrace$ we need to check if $197$, $971$, and $719$ are all prime. But we should only check this rotation class once since every member of the class has the same set of rotations.

One way to only check the primality of the rotation class once is to only do it when we reach the smallest member of the class. While enumerating the candidates in increasing order, we can skip numbers whose rotations produce a smaller number because we would have already checked it. Checking whether $p$ is the smallest of its rotations is cheap (much cheaper than a primality test): keep rotating $p$ and give up as soon as a rotation comes out smaller.

This is essentially what [jorgbrown](https://projecteuler.net/thread=35;page=2#6164) did in the [Project Euler forum thread](https://projecteuler.net/thread=35) for this problem back in 2007.

@code[problem-0035:search_rotation_classes!]

We still generate all $4^d$ candidates and throw most of them away after a rotation or two. [heckomorphism](https://projecteuler.net/thread=35;page=6#441111) avoids generating them at all. Their Julia solution enumerates one representative per necklace directly with [Duval's algorithm](https://en.wikipedia.org/wiki/Lyndon_word#Generation) for Lyndon words. This felt a bit too fancy for me but it would reduce the search space, especially for large $N$. The main cost is still the primality tests though.

For the primality test we use the deterministic [Miller–Rabin test](https://en.wikipedia.org/wiki/Miller%E2%80%93Rabin_primality_test). Constructing it with the largest rotation we could possibly see picks the fewest witnesses that make the test exact for all of them. The trial division `is_prime` from [Problem 7](/blog/project-euler/problem-0007/) is actually a tiny bit faster for $N = 10^6$ but at $N = 10^{12}$ Miller–Rabin is much faster (~50x).

@code[problem-0035:find_circular_primes]

The single-digit primes are circular by definition but are made of forbidden digits, so they're added separately. We loop over the number of digits so that each digit count gets its own Miller–Rabin witnesses.

This finds the circular primes below a million in @benchmark[problem-0035:find_circular_primes_1M]. The largest of them is $999{,}331$, a rotation of $199{,}933$, and they fall into $19$ rotation classes with a sum of $8{,}184{,}200$.

Running this with $N = 10^{12}$ takes @benchmark[problem-0035:find_circular_primes_1T] and I was slightly disappointed that it finds exactly the same circular primes as $N = 10^6$: there are no circular primes with $7$ to $12$ digits. The next one is the 19-digit [repunit](https://en.wikipedia.org/wiki/Repunit) $R_{19} = 1{,}111{,}111{,}111{,}111{,}111{,}111$, and after that come $R_{23}$, $R_{317}$ and $R_{1031}$. [Wikipedia](https://en.wikipedia.org/wiki/Circular_prime) lists no other circular primes besides repunit primes, and it's conjectured that there are only finitely many circular primes that aren't repunits. The circular primes are [OEIS A068652](https://oeis.org/A068652) and the smallest member of each rotation class is [OEIS A016114](https://oeis.org/A016114).
