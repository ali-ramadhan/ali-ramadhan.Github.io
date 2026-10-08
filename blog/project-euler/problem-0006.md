---
layout: "project-euler-post"
problem_number: 6
problem_name: "Sum Square Difference"
date: 2025-10-07
benchmark_file: "problem-0006"
benchmark_key: "n_100"
---

> The sum of the squares of the first ten natural numbers is,
>
> $$1^2 + 2^2 + ... + 10^2 = 385.$$
>
> The square of the sum of the first ten natural numbers is,
>
> $$(1 + 2 + ... + 10)^2 = 55^2 = 3025.$$
>
> Hence the difference between the sum of the squares of the first ten natural numbers and the square of the sum is $3025 - 385 = 2640$.
>
> Find the difference between the sum of the squares of the first one hundred natural numbers and the square of the sum.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler006/problem) raises the limit from $100$ to $N \leqslant 10^4$, with up to $10^4$ queries per run.
:::

## Analytic solution

Not sure if there's much to say on this problem besides that using two special cases of [Faulhaber's formula](https://en.wikipedia.org/wiki/Faulhaber%27s_formula) for powers of 1 and 2 we can write

```math
\sum_{k=1}^n k = \frac{n(n+1)}{2}
```

and

```math
\sum_{k=1}^n k^2 = \frac{n(n+1)(2n+1)}{6}
```

So we can compute the answer directly using

```math
\begin{align}
  \operatorname{SSD}(n) &= \left( \sum_{k=1}^n k \right)^2 - \sum_{k=1}^n k^2 \\
                        &= \left( \frac{n(n+1)}{2} \right)^2 - \frac{n(n+1)(2n+1)}{6} \\
                        &= \frac{n(n+1)(n-1)(3n+2)}{12}
\end{align}
```

With a simple implementation

@code[problem-0006:sum_square_difference]

we call `sum_square_difference(100)` to compute the solution which runs in @benchmark[problem-0006:n_100].

## What the answers count

It turns out that actually there is a bit more to say. The answers $\operatorname{SSD}(n) = 0, 4, 22, 70, 170, 350, \dots$ are [OEIS A052149](https://oeis.org/A052149), which describes them as the number of rectangles on an $n \times n$ board that aren't squares.

To see why, notice that a rectangle on the board is picked out by choosing two of the $n + 1$ vertical grid lines for its left and right sides, and two of the $n + 1$ horizontal grid lines for its top and bottom. So the number of rectangles is

```math
\binom{n+1}{2}^2 = \left( \frac{n(n+1)}{2} \right)^2 = \left( \sum_{k=1}^n k \right)^2
```

which is the square of the sum! A $k \times k$ square fits on the board in $(n - k + 1)^2$ different positions, so going from $k = 1$ to $k = n$ there are $n^2 + (n-1)^2 + \cdots + 1^2$ squares, which is the sum of the squares. The difference counts the rectangles that aren't squares. A chessboard, for example, has $36^2 = 1296$ rectangles and $204$ squares, so $\operatorname{SSD}(8) = 1092$ of its rectangles aren't squares.

The same numbers show up when placing two queens peacefully on a chessboard. Two queens can attack each other if they're in the same row, column, or diagonal. If we put a dot in the center of each cell of an $(n+1) \times (n+1)$ board, the dots are the corners of the cells of an $n \times n$ board. Two queens in different rows and different columns then sit peacefully on opposite corners of a rectangle on the smaller board, and they're on the same diagonal (and vulnerable) exactly when that rectangle is a square. Every rectangle has two pairs of opposite corners, so there are $2 \operatorname{SSD}(n)$ ways to place two queens on an $(n+1) \times (n+1)$ board so that neither attacks the other ([OEIS A036464](https://oeis.org/A036464)).

These numbers also show up in combinatorics. Expanding

```math
x(x+1)(x+2) \cdots (x+n) = x^{n+1} + \left( \sum_{k=1}^n k \right) x^n + \left( \sum_{1 \leq i < j \leq n} ij \right) x^{n-1} + \cdots
```

the coefficient of $x^{n-1}$ is half the answer. The coefficients of this polynomial are the (unsigned) [Stirling numbers of the first kind](https://en.wikipedia.org/wiki/Stirling_numbers_of_the_first_kind), where the coefficient of $x^k$ counts the permutations of $n + 1$ objects that have exactly $k$ cycles. So

```math
\operatorname{SSD}(n) = 2 \left[ {n+1 \atop n-1} \right]
```

and half the answers $0, 2, 11, 35, 85, 175, \dots$ are [OEIS A000914](https://oeis.org/A000914).
