---
layout: "project-euler-post"
problem_number: 4
problem_name: "Largest Palindrome Product"
date: 2025-10-07
benchmark_file: "problem-0004"
benchmark_key: "3_digits"
floating_toc: true
---

> A palindromic number reads the same both ways. The largest palindrome made from the product of two $2$-digit numbers is $9009 = 91 \times 99$.
>
> Find the largest palindrome made from the product of two $3$-digit numbers.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler004/problem) keeps the two $3$-digit factors but asks for the largest such palindrome below a given $N < 10^6$, with up to $100$ queries per run.
:::

[[toc]]

## The naive approach

First let's write a function that can quickly test whether an integer $n$ is a palindrome. This can be done pretty easily and elegantly:

```julia
function is_palindrome(n)
    n = abs(n)  # handle negative numbers
    return string(n) == reverse(string(n))
end
```

The most naive solution checks every product $ij$ of two $n$-digit numbers this way:

@code[problem-0004:integer_type,largest_palindrome_product_naive]

The products have up to $2n$ digits, so the integer type `T` defaults to the smallest one they fit in: `Int64` up to $9$ digits, and `Int128` after that.

It finds the answer in @benchmark[problem-0004:naive_3_digits] but allocates @benchmark[problem-0004:naive_3_digits:memory] along the way, since it builds two new strings for each of the $900^2 = 810,000$ products. The 6-digit case has a million times more products to check, so it would take hours.

## Searching the largest products first

Testing for palindromes with strings allocates memory for two strings every time. We can instead take a numerical approach where we reverse the number by extracting digits from right to left and rebuilding the number:

@code[src/utils/Digits.jl:is_palindrome]

We can then use this function to search for the largest palindrome made from the product of two $n$-digit numbers:

@code[problem-0004:largest_palindrome_product]

So we search through all products $ij$ in descending order to find the largest palindrome. The search is sped up in a few ways. First, we iterate from largest to smallest values since we're searching for a maximum. This lets us terminate early if $ij$ can no longer exceed the current maximum palindrome found so far. We also added a `max_product` option that only considers products below a given value, which is what the [HackerRank version](https://www.hackerrank.com/contests/projecteuler/challenges/euler004/problem) asks for. With up to $100$ queries per run though, the [submission](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl/blob/main/hacker_rank/projecteuler+_problem0004.jl) instead precomputes every palindrome product of two $3$-digit numbers once and binary searches that sorted list for each query.

Benchmarking the 3-digit case we find the solution `largest_palindrome_product(3)` in @benchmark[problem-0004:3_digits], which is @ratio[problem-0004:naive_3_digits/3_digits] faster than the naive solution.

For the 6-digit case we call `largest_palindrome_product(6)` to find a maximum palindrome of $999,000,000,999 = 999,001 \times 999,999$ in @benchmark[problem-0004:6_digits].

We can also do the 9-digit case and call `largest_palindrome_product(9)` to find $999,900,665,566,009,999 = 999,920,317 \times 999,980,347$ in @benchmark[problem-0004:9_digits] which is still under a minute.

Beyond that, the product of two 10-digit numbers no longer fits in a 64-bit integer, so `T` switches to `Int128`. The 12-digit case will probably also take a lot longer than 1 minute! Besides `Int128` operations taking more CPU cycles than `Int64` operations, the solution time scales superlinearly.

There are $R = 9 \times 10^{n-1}$ numbers with $n$ digits. In the worst case our solution takes $\mathcal{O}(R^2 n)$ time as it checks all $(i, j)$ pairs of which there are $R^2$ pairs and calls to `is_palindrome` take $\mathcal{O}(n)$ time. The early termination optimizations will reduce the number of pairs to check by a lot but in the worst case you're still searching a large space.
