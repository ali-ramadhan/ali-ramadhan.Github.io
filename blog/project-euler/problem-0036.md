---
layout: "project-euler-post"
problem_number: 36
problem_name: "Double-base Palindromes"
date: 2026-09-26
benchmark_file: "problem-0036"
benchmark_key: "find_double_base_palindromes_1M"
---

> The decimal number, $585 = 1001001001_2$ (binary), is palindromic in both bases.
>
> Find the sum of all numbers, less than one million, which are palindromic in base $10$ and base $2$.
>
> (Please note that the palindromic number, in either base, may not include leading zeros.)

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler036/problem) asks for the same sum below any $N \leqslant 10^6$ and for any base $2 \leqslant K \leqslant 9$ rather than just base $2$.
:::

We'll solve the more general problem of finding all numbers below $N$ that are palindromes in both base $10$ and base $K$. The original problem is the case $N = 10^6$ and $K = 2$.

In [Problem 4](/blog/project-euler/problem-0004/) we checked whether a number is a palindrome by reversing its digits. In base $K$ we peel off the last digit by dividing by $K$ instead of $10$ and tack it on by multiplying by $K$, so all `is_palindrome` needs is a `base` keyword:

@code[src/utils/Digits.jl:is_palindrome]

The simplest solution is to check every number below $N$ in both bases, starting with base $10$ since that rules out almost everything:

@code[problem-0036:find_double_base_palindromes_naive]

This takes @benchmark[problem-0036:find_double_base_palindromes_naive_1M] for $N = 10^6$, which is plenty fast for the original problem. But almost all of that time is spent confirming that numbers aren't palindromes: only about 0.2% of the numbers below $10^6$ are palindromes in base $10$.

So instead of searching for palindromes, let's build them. A palindrome is determined by its first half: $123321$ is $123$ followed by $123$ reversed, and $12321$ is $123$ followed by $12$ reversed since the middle digit only shows up once. So every palindrome with $L$ digits can be built from a number $h$ with $k = \lceil L/2 \rceil$ digits by appending the digits of $h$ in reverse, leaving out the last one when $L$ is odd:

@code[src/utils/Digits.jl:make_palindrome]

Each $L$-digit palindrome is built from exactly one $h$, its own first half. There are $9 \cdot 10^{k-1}$ numbers with $k$ digits, so there are $9$ palindromes with one digit, $9$ with two digits, $90$ with three, $90$ with four, and so on. Below $10^6$ that's $9 + 9 + 90 + 90 + 900 + 900 = 1{,}998$ palindromes, not counting $0$, and in general the number of palindromes below $N$ grows like $\sqrt{N}$ since we only get to pick half of the digits.

We start with $0$, which is a palindrome in every base, and build the rest one length at a time. For $L = 3$ the first halves $h = 10, 11, 12, \dots, 99$ give the palindromes $101, 111, 121, \dots, 999$. All that's left is to check each one in base $K$:

@code[problem-0036:find_double_base_palindromes]

The one-line method at the top is there for speed. Julia compiles a separate copy of a function for each combination of argument types, so with $K$ always an `Int` a single copy of the search would handle every base. It couldn't know what `divrem(n, base)` in `is_palindrome` divides by and would have to use the CPU's division instruction, which is slow. `Val(K)` turns the value of $K$ into a type like `Val{2}`, so each base gets its own copy of the search with $K$ as a constant. Since `is_palindrome` is marked `@inline`, its code gets pasted into each copy where the compiler can see what it's dividing by. Dividing by $2$ becomes a bit shift and dividing by $9$ becomes a multiplication by a precomputed constant, both much cheaper than a division. For $K = 2$ this makes the search @ratio[problem-0036:find_double_base_palindromes_runtime_base_1T/find_double_base_palindromes_1T] faster at $N = 10^{12}$ than the same code with $K$ only known at runtime. The price is compiling a new copy of the search the first time each base comes up.

This finds the double-base palindromes below $10^6$ in @benchmark[problem-0036:find_double_base_palindromes_1M], which is @ratio[problem-0036:find_double_base_palindromes_naive_1M/find_double_base_palindromes_1M] faster than checking every number.

Going up to $N = 10^{12}$ takes @benchmark[problem-0036:find_double_base_palindromes_1T] and finds $39$ double-base palindromes, the largest being $136{,}525{,}525{,}631$. That's a thousand times more palindromes to build than for $N = 10^6$, and each one takes longer to check since it has twice as many binary digits. How long a base takes depends on both how many digits numbers have in that base, from up to $40$ in base $2$ down to $13$ in base $9$ below $10^{12}$, and how cheap it is to divide by it. Dividing by a power of $2$ is a bit shift, so bases $2$, $4$ and $8$ are quicker than their number of digits would suggest. Here's every base the HackerRank version asks about, plus $N = 10^{15}$ for base $2$:

| $N$       | $K$ | OEIS                                | Double-base palindromes | Sum                   | Time                                                        |
| --------- | --- | ----------------------------------- | ----------------------- | --------------------- | ----------------------------------------------------------- |
| $10^6$    | 2   | [A007632](https://oeis.org/A007632) | 20                      |                       | @benchmark[problem-0036:find_double_base_palindromes_1M]    |
| $10^{12}$ | 2   | [A007632](https://oeis.org/A007632) | 39                      | 394,832,891,346       | @benchmark[problem-0036:find_double_base_palindromes_1T]    |
| $10^{15}$ | 2   | [A007632](https://oeis.org/A007632) | 52                      | 1,559,246,513,298,687 | @benchmark[problem-0036:find_double_base_palindromes_1e15]  |
| --------- | --- | ----------------------------------- | ----------------------- | --------------------- | ----------------------------------------------------------- |
| $10^{12}$ | 3   | [A007633](https://oeis.org/A007633) | 41                      | 144,436,873,316       | @benchmark[problem-0036:find_double_base_palindromes_1T_K3] |
| $10^{12}$ | 4   | [A029961](https://oeis.org/A029961) | 36                      | 1,254,935,068,337     | @benchmark[problem-0036:find_double_base_palindromes_1T_K4] |
| $10^{12}$ | 5   | [A029962](https://oeis.org/A029962) | 31                      | 43,401,017,264        | @benchmark[problem-0036:find_double_base_palindromes_1T_K5] |
| $10^{12}$ | 6   | [A029963](https://oeis.org/A029963) | 65                      | 283,958,331,810       | @benchmark[problem-0036:find_double_base_palindromes_1T_K6] |
| $10^{12}$ | 7   | [A029964](https://oeis.org/A029964) | 39                      | 1,936,733,892,725     | @benchmark[problem-0036:find_double_base_palindromes_1T_K7] |
| $10^{12}$ | 8   | [A029804](https://oeis.org/A029804) | 45                      | 914,703,021,014       | @benchmark[problem-0036:find_double_base_palindromes_1T_K8] |
| $10^{12}$ | 9   | [A029965](https://oeis.org/A029965) | 48                      | 852,336,088,346       | @benchmark[problem-0036:find_double_base_palindromes_1T_K9] |

The base $2$ results match the list of every double-base palindrome below $10^{12}$ that [mvz](https://projecteuler.net/thread=36#1652) posted in the [forum thread](https://projecteuler.net/thread=36) back in 2005, and the sums that [NP](https://projecteuler.net/thread=36;page=5#440098), [8folder](https://projecteuler.net/thread=36;page=8#456103), and [yzqt](https://projecteuler.net/thread=36;page=8#456926) posted more recently.

We could also have built the palindromes in base $K$ and checked them in base $10$, but there are roughly as many palindromes below $N$ in any base so it wouldn't save much. And for $K = 2$ we could skip the decimal palindromes that start with an even digit, since they also end in one and every binary palindrome other than $0$ is odd, but that trick is specific to base $2$.

[Eshed Schacham](https://ashdnazg.github.io/articles/22/Finding-Really-Big-Palindromes) has a great write-up on finding really big binary-decimal palindromes, which starts with this same mirroring approach and then goes much further.

The numbers that are palindromes in both base $2$ and base $10$ are [OEIS A007632](https://oeis.org/A007632). They get big fast: $175$ of them are listed, the largest with $53$ digits, and the last $28$ were found by Eshed's search. Our solution runs in $\mathcal{O}(\sqrt{N} \log N)$ time since there are $\mathcal{O}(\sqrt{N})$ palindromes below $N$ and building and checking each one takes $\mathcal{O}(\log N)$ divisions.
