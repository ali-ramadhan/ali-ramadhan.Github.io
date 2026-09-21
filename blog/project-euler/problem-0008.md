---
layout: "project-euler-post"
problem_number: 8
problem_name: "Largest Product in a Series"
date: 2025-10-09
benchmark_file: "problem-0008"
benchmark_key: "window_13"
---

> The four adjacent digits in the $1000$-digit number that have the greatest product are $9 \times 9 \times 8 \times 9 = 5832$.
>
> <pre style="text-align: center; font-family: monospace;">
> 73167176531330624919225119674426574742355349194934
> 96983520312774506326239578318016984801869478851843
> 85861560789112949495459501737958331952853208805511
> 12540698747158523863050715693290963295227443043557
> 66896648950445244523161731856403098711121722383113
> 62229893423380308135336276614282806444486645238749
> 30358907296290491560440772390713810515859307960866
> 70172427121883998797908792274921901699720888093776
> 65727333001053367881220235421809751254540594752243
> 52584907711670556013604839586446706324415722155397
> 53697817977846174064955149290862569321978468622482
> 83972241375657056057490261407972968652414535100474
> 82166370484403199890008895243450658541227588666881
> 16427171479924442928230863465674813919123162824586
> 17866458359124566529476545682848912883142607690042
> 24219022671055626321111109370544217506941658960408
> 07198403850962455444362981230987879927244284909188
> 84580156166097919133875499200524063689912560717606
> 05886116467109405077541002256983155200055935729725
> 71636269561882670428252483600823257530420752963450
> </pre>
>
> Find the thirteen adjacent digits in the $1000$-digit number that have the greatest product. What is the value of this product?

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler008/problem) takes any number of up to $N \leqslant 1000$ digits as input along with a window size $K \leqslant 7$, with up to $100$ queries per run.
:::

We can slide a window of length `num_digits` across the string, compute the product of digits in each window, and track the maximum. One optimization is to skip any window containing a `'0'` since its product will be zero.

@code[problem-0008:BIG_NUMBER,product_of_digits,largest_product_in_series]

Calling `largest_product_in_series(13)` returns the solution in @benchmark[problem-0008:window_13]. We can also run the example from the problem description, `largest_product_in_series(4)`, which returns $(5832, \text{"9989"})$ in @benchmark[problem-0008:window_4].

The algorithm runs in $\mathcal{O}(nk)$ time where $n$ is the length of the string and $k$ is the window size. The early termination on zeros provides a constant-factor speedup but doesn't change the asymptotic complexity.
