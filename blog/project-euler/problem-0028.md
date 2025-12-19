---
layout: "project-euler-post"
problem_number: 28
problem_name: "Number Spiral Diagonals"
date: 2025-12-18
---

> Starting with the number $1$ and moving to the right in a clockwise direction a $5$ by $5$ spiral is formed as follows:
>
> <pre style="text-align: center; font-family: monospace;">
> <span style="color: red;"><b>21</b></span> 22 23 24 <span style="color: red;"><b>25</b></span>
> 20  <span style="color: red;"><b>7</b></span>  8  <span style="color: red;"><b>9</b></span> 10
> 19  6  <span style="color: red;"><b>1</b></span>  2 11
> 18  <span style="color: red;"><b>5</b></span>  4  <span style="color: red;"><b>3</b></span> 12
> <span style="color: red;"><b>17</b></span> 16 15 14 <span style="color: red;"><b>13</b></span>
> </pre>
>
> It can be verified that the sum of the numbers on the diagonals is $101$.
>
> What is the sum of the numbers on the diagonals in a $1001$ by $1001$ spiral formed in the same way?

Looking at the spiral, the diagonal numbers are just 1 in the center plus the four corners of each ring. The $5 \times 5$ spiral has two rings around the center: an inner ring with corners 3, 5, 7, 9 and an outer ring with corners 13, 17, 21, 25. Looking at the top-right diagonal the pattern is 1, 9, 25 which is $1^2$, $3^2$, $5^2$.

For an $n \times n$ spiral where $n = 2k + 1$, ring $k$ seems to end at the top-right corner with a value of $(2k+1)^2$. After completing ring $k$, we've filled a $(2k+1) \times (2k+1)$ square containing $(2k+1)^2$ cells. We fill each cell sequentially starting from 1, so then it makes sense that after filling $(2k+1)^2$ cells, the top-right diagonal will have that value.

Going backwards (counterclockwise) from the top-right corner, each corner is $2k$ steps apart since each side of ring $k$ has length $2k$. So the value at the top-left corner is $(2k+1)^2 - 2k$, at the bottom-left corner it is $(2k+1)^2 - 4k$, and at the bottom-right it is $(2k+1)^2 - 6k$.

The sum of the four corners for ring $k$ is

```math
(2k+1)^2 + (2k+1)^2 - 2k + (2k+1)^2 - 4k + (2k+1)^2 - 6k = 4(2k+1)^2 - 12k = 16k^2 + 4k + 4
```

For an $n \times n$ spiral with $m = (n-1)/2$ rings, the total diagonal sum is

```math
1 + \sum_{k=1}^{m} (16k^2 + 4k + 4) = 1 + 16 \sum_{k=1}^{m} k^2 + 4 \sum_{k=1}^{m} k + 4m
```

Using [Faulhaber's formula](https://en.wikipedia.org/wiki/Faulhaber%27s_formula) which came up in [Problem 6](/blog/project-euler/problem-0006/) we know that

```math
\sum_{k=1}^{m} k = \frac{m(m+1)}{2} \quad \text{and} \quad \sum_{k=1}^{m} k^2 = \frac{m(m+1)(2m+1)}{6}
```

```julia
function diagonal_sum(n)
    if n % 2 == 0
        error("Spiral size must be odd")
    end

    m = (n - 1) ÷ 2

    sum_k = m * (m + 1) ÷ 2
    sum_k² = m * (m + 1) * (2 * m + 1) ÷ 6

    return 1 + 16 * sum_k² + 4 * sum_k + 4 * m
end
```

The answer is computed in @benchmark[problem-0028:diagonal_sum_1001]. A $10^6 + 1$ by $10^6 + 1$ spiral has a diagonal sum of 666669166671000001 and is computed in @benchmark[problem-0028:diagonal_sum_1m].

This kind of number spiral is related to the [Ulam spiral](https://en.wikipedia.org/wiki/Ulam_spiral) where prime numbers tend to cluster along certain diagonals.
