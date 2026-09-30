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

## Fermat's factorization method

I asked Claude how we can do better and it suggested Fermat's factorization method, an idea it most likely picked up from solutions to [LeetCode 479](https://leetcode.com/problems/largest-palindrome-product/description/).

Both solutions so far loop over pairs of factors and check whether their product is a palindrome. We can flip the search around and instead check each palindrome starting with the largest one, and for each one ask whether it's the product of two $n$-digit numbers.

There are far fewer palindromes than products, and the answer is always close to the top. So hopefully we don't have to search for long. Getting the factors means trial division, which is slow, but because both factors are close to $10^n$, we can check each palindrome with just an integer square root or two!

Let $2n$ be the number of digits in the palindrome. Then let $B = 10^n$ and write both factors as distances below $B$, so that $x = B - u$ is one factor and $y = B - v$ is the other. Multiplying them out we get

```math
xy = (B - u)(B - v) = B^2 - (u + v)B + uv = \big[B - (u + v)\big]B + uv
```

Multiplying by $B = 10^n$ just shifts a number $n$ digits to the left. So as long as $uv < B$, the upper $n$ digits of $xy$ are $B - (u + v)$ and the lower $n$ digits are $uv$.

A $2n$-digit palindrome is determined by its upper half $U$, since the lower half is just $U$ with its digits reversed. So let's write the upper half as $U = B - m$ and the lower half as $L = \mathrm{reverse}(U)$.

Then $m = 1, 2, 3, \dots$ lists the palindromes from the largest down: $999999$, $998899$, $997799$, and so on. The palindrome with top half $B - m$ is a product $xy$ exactly when both halves match, i.e.

```math
u + v = m \quad \text{and} \quad uv = L
```

Knowing the sum and product of two numbers is enough to work out the numbers themselves! Since $(t - u)(t - v) = t^2 - (u + v)t + uv$, the numbers $u$ and $v$ are the two roots of the quadratic $t^2 - mt + L = 0$, so

```math
u, v = \frac{m \pm \sqrt{D}}{2} \quad \text{where} \quad D = m^2 - 4L
```

These are whole numbers only when the discriminant $D$ is a perfect square, which a single `isqrt` can tell us. In fact $D = (u + v)^2 - 4uv = (u - v)^2$, so $\sqrt{D}$ is just the gap between $u$ and $v$.

We assumed $uv < B$, but what if $uv \geq B$? a larger $uv$ spills into the upper half, just like carrying when adding by hand. If the carry $c$ is how many whole $B$'s fit into $uv$, the upper half is $B - (u + v) + c$ and the lower half is $uv - cB$. So the palindrome with upper half $B - m$ is $xy$ when

```math
u + v = m + c \quad \text{and} \quad uv = cB + L
```

We don't know the carry ahead of time, so we try $c = 0, 1, 2, \dots$, each with its own discriminant

```math
D = (m + c)^2 - 4\big(cB + L\big)
```

$D$ only shrinks as $c$ grows so we can stop at the first negative $D$ as we cannot get a perfect square by increasing $c$ anymore.

Solutions to the [LeetCode version](https://leetcode.com/problems/largest-palindrome-product/) of this problem, which only goes up to 8 digits, use the same idea without the carry. As far as I can tell it goes back to a 2017 reply by nizametdinov on LeetCode's discussion board, which [CerebrumMaize](https://leetcode.com/problems/largest-palindrome-product/solutions/96305/python-solution-using-math-in-48ms/) and [Minghan](https://medium.com/@d_dchris/largest-palindrome-product-problem-brilliant-approach-using-mathematics-python3-leetcode-479-b3f2dd91b1aa) turned into popular write-ups. As hvsavage pointed out in the comments on [Minghan's LeetCode post](https://leetcode.com/problems/largest-palindrome-product/solutions/171580/Python-Solution-using-Math-and-Detailed-Mathematical-deduction/), dropping the carry breaks at 9 digits. I guess Claude's contribution is the carry.

Putting it all together:

@code[problem-0004:reverse_digits,largest_palindrome_product_fermat]

`uv_max` keeps both factors at $n$ digits, and the inner loop tries carries until $D$ goes negative. This search can't miss a factorization: every way of writing a palindrome as a product of two $n$-digit numbers gives some $u$, $v$, and $c \ge 0$ that satisfy both equations, and for that carry $D = (u - v)^2 \ge 0$, so it gets tested before the loop stops. And since the palindromes get smaller as $m$ grows, the first one that passes is the largest.

This is [Fermat's factorization method](https://en.wikipedia.org/wiki/Fermat%27s_factorization_method) in disguise. Fermat factors a number $N$ by looking for an $a$ that makes $a^2 - N$ a perfect square $b^2$, because then $N = (a - b)(a + b)$. It's fast when the two factors are close together. Here $x + y = 2B - (m + c)$, so our discriminant is $D = (x + y)^2 - 4xy = (x - y)^2$, which is the same test with $a = (x + y)/2$. The digits of the palindrome pin down $x + y$ to one candidate per carry, and both factors are within about $10^{n/2}$ of $10^n$, so they're very close together.

How many palindromes do we have to check? For even $n$, the palindrome $99\dots900\dots099\dots9 = (10^n - 1)(10^n - 10^{n/2} + 1)$ is always a product of two $n$-digit numbers. Its top half is $B - 10^{n/2}$, so we never check more than $10^{n/2} = \sqrt{B}$ palindromes. There's no such guarantee for odd $n$, but for every $n$ up to $24$ the answer has turned up within $4 \times 10^{n/2}$ palindromes of the top. The search also only works with numbers around $10^n$ rather than $10^{2n}$, so 64-bit integers are enough for up to 18 digits, which is why `T` defaults to `integer_type(n)` here rather than `integer_type(2n)`. Only the palindrome itself needs 128 bits once the factors have 10 or more digits, which `widemul` takes care of.

Benchmarking `largest_palindrome_product_fermat(9)` we find the answer in @benchmark[problem-0004:fermat_9_digits], which is @ratio[problem-0004:9_digits/fermat_9_digits] faster than searching the largest products first. The 12-digit case, which would take many hours by searching products, finds $999,999,000,000,000,000,999,999 = 999,999,000,001 \times 999,999,999,999$ in @benchmark[problem-0004:fermat_12_digits], and the 15-digit case finds $999,999,974,180,040,040,081,479,999,999 = 999,999,975,838,971 \times 999,999,998,341,069$ in @benchmark[problem-0004:fermat_15_digits].

The time mostly depends on how many palindromes we check before reaching the answer: $99,335$ for 9 digits, $1,000,000$ for 12 digits and $25,819,960$ for 15 digits.
