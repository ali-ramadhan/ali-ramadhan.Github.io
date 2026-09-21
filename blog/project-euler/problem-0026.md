---
layout: "project-euler-post"
problem_number: 26
problem_name: "Reciprocal Cycles"
date: 2025-12-17
benchmark_file: "problem-0026"
benchmark_key: "find_longest_cycle_1000"
---

> A unit fraction contains $1$ in the numerator. The decimal representation of the unit fractions with denominators $2$ to $10$ are given:
>
> ```math
> \begin{align}
>   1/2 &= 0.5 \\
>   1/3 &= 0.(3) \\
>   1/4 &= 0.25 \\
>   1/5 &= 0.2 \\
>   1/6 &= 0.1(6) \\
>   1/7 &= 0.(142857) \\
>   1/8 &= 0.125 \\
>   1/9 &= 0.(1) \\
>   1/10 &= 0.1
> \end{align}
> ```
>
> Where $0.1(6)$ means $0.166666\cdots$, and has a $1$-digit recurring cycle. It can be seen that $1/7$ has a $6$-digit recurring cycle.
>
> Find the value of $d < 1000$ for which $1/d$ contains the longest recurring cycle in its decimal fraction part.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler026/problem) raises the limit from $1000$ to any $N \leqslant 10^4$ (asking for the smallest $d$ on ties), with up to $1000$ queries per run.
:::

To figure out how to compute the digits and the cycle length, let's compute $1/7$ using good old [long division](https://en.wikipedia.org/wiki/Long_division).

```math
\require{enclose}
\begin{array}{r}
  \phantom{7\enclose{longdiv}{\,}}0.142857\ldots \\[3pt]
  7\enclose{longdiv}{\,1.000000\phantom{0}} \\[-3pt]
  \underline{-7\phantom{.00000}} \phantom{0} \\[-3pt]
  30\phantom{.0000} \phantom{0} \\[-3pt]
  \underline{-28\phantom{.0000}} \phantom{0} \\[-3pt]
  20\phantom{.000} \phantom{0} \\[-3pt]
  \underline{-14\phantom{.000}} \phantom{0} \\[-3pt]
  60\phantom{.00} \phantom{0} \\[-3pt]
  \underline{-56\phantom{.00}} \phantom{0} \\[-3pt]
  40\phantom{.0} \phantom{0} \\[-3pt]
  \underline{-35\phantom{.0}} \phantom{0} \\[-3pt]
  50\phantom{.} \phantom{0} \\[-3pt]
  \underline{-49\phantom{.}} \phantom{0} \\[-3pt]
  1\phantom{.} \phantom{0}
\end{array}
```

After six steps we're left with remainder 1, which is exactly what we started with. The remainder completely determines the next digit and the next remainder, so from here the process must repeat, producing 142857 again. The cycle length is how many steps it takes to get back to remainder 1.

To find the cycle length, we don't need to compute the actual digits. We just simulate the long division, tracking only the remainder: multiply by 10, take modulo $d$, and count steps until the remainder returns to 1.

@code[problem-0026:cycle_length]

Why strip out factors of 2 and 5? Looking at the table from the problem, the fractions that terminate ($1/2$, $1/4$, $1/5$, $1/8$, $1/10$) are exactly those whose denominators only have factors of 2 and 5. These terminate because we can always convert them to a power of 10 in the denominator: $1/4 = 25/100 = 0.25$, $1/5 = 2/10 = 0.2$. Since $10 = 2 \times 5$, factors of 2 and 5 never cause repeating digits in base 10.

Finding the longest cycle is now a simple search:

@code[problem-0026:find_longest_cycle]

The answer is computed in @benchmark[problem-0026:find_longest_cycle_1000]. Extending to $d \lt 10^5$ takes @benchmark[problem-0026:find_longest_cycle_100k] and finds that $1/99989$ has the longest cycle.
