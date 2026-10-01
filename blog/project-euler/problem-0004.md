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

## Skipping palindromes that can't be products

The Fermat search reverses the upper half of every palindrome and then computes a discriminant and an integer square root for every carry it tries. But most palindromes can be ruled out by looking at just a few of their digits, before doing any of that work, and the ones that are left can be checked more cheaply.

Let $s = u + v = m + c$. Near the top, the upper half starts with $999$, so the palindrome ends in $999$. The lower half is $uv - cB$ and $B = 10^n$ is a multiple of $1000$, so $uv$ ends in $999$ as well. That tells us a lot about $s$.

First, $uv$ ends in $9$, so $u$ and $v$ end in $1$ and $9$, $3$ and $3$, or $7$ and $7$. So $s$ ends in $0$, $6$ or $4$. Second, $uv \equiv 999 \equiv 7 \pmod 8$, so $u$ and $v$ are both odd. The residue of a number modulo $k$ is its remainder after dividing by $k$. The only odd residues modulo $8$ that multiply to $7$ are $1 \times 7$ and $3 \times 5$. Both add up to $8$, so $s \equiv 0 \pmod 8$.

These rules are about $s$ rather than $m$, so we'll loop over $s$ instead and set $m = s - c$ for each carry. Modulo $120$ they only allow these residues:

@code[problem-0004:SUM_RESIDUES]

Working modulo $120 = 8 \times 3 \times 5$ rather than $40$ means each residue also tells us $s \bmod 3$, which the next rule needs. A number is congruent to its digit sum modulo $3$, and the upper and lower halves have the same digits, so $L \equiv U \pmod 3$. Since $4 \equiv B \equiv 1 \pmod 3$ and $U = B - m = B - s + c$, the discriminant becomes

```math
D = s^2 - 4(cB + L) \equiv s^2 + s + c - 1 \pmod 3
```

A perfect square is always $0$ or $1$ modulo $3$, so we can skip any $s$ and $c$ that make this $2$. Here `r` is $s \bmod 120$:

@code[problem-0004:passes_mod_3_rule]

Without a carry that only leaves $s \equiv 1 \pmod 3$, i.e. $s \equiv 16$, $40$ or $64 \pmod{120}$. And there can't be a carry while $s^2 < 4B$, since $cB \le uv \le s^2/4$. So near the top only $1$ in $40$ values of $s$ needs checking.

The middle of the palindrome narrows it down even further. The last digit of $U$ is $d = (c - s) \bmod 10$, and it's also the first digit of $L$, so $L \ge d \times 10^{n-1}$. For $D \ge 0$ we need $s^2 \ge 4(cB + L)$, so we can check $s^2 \ge 4(cB + d \times 10^{n-1})$ before working out $L$ at all:

@code[problem-0004:passes_middle_digit_rule]

Without a carry, $s \equiv 16$ gives $d = 4$, so it needs $s \ge 1.26\sqrt{B}$, and $s \equiv 64$ gives $d = 6$, so it needs $s \ge 1.55\sqrt{B}$. Closer to the top only $s \equiv 40$ is left, so only $1$ in $120$ palindromes gets checked. These all have $d = 0$, i.e. $00$ in the middle, which is why $17$ of the $23$ answers from $2$ to $24$ digits do. To find the 6-digit answer, for example, the plain search walks through the top $1000$ palindromes, but now the full check only runs for $s = 40, 160, 280, \dots, 1000$, and the ninth one gives $999,000,000,999 = 999,001 \times 999,999$.

The palindromes that get through can also be checked more cheaply:

- Near the top the upper half is a run of $9$s followed by a short tail, so the lower half is the reversed tail followed by $9$s, and only the tail needs reversing. Reversing takes a division per digit, and once the numbers need `Int128` those divisions are slow, but the tail always fits in an `Int64`.
- Only $12$ of the $64$ residues modulo $64$ are perfect squares, so checking $D \bmod 64$ against a 64-bit mask first rules out about $81\%$ of the non-squares before taking the square root.
- Julia turns `s^2` into `s * s` for integers up to 64 bits, but for `Int128` it calls the generic `power_by_squaring`, so we write `s * s` ourselves.

@code[problem-0004:lower_half,reverse_tail,SQUARES_MOD_64,perfect_square_root]

Looping over $s$ has one catch: we no longer visit the palindromes in order, since a larger $s$ with a larger carry can still give a smaller $m$. The 9-digit answer has $s = 99,336$ and $c = 1$, for example, so $m = 99,335$. So instead of stopping at the first hit, we keep the smallest $m$ found so far. The carry is at most $s^2/4B$, so every $s$ from here on gives $m \ge s - \lfloor s^2/4B \rfloor$, and once that's larger than the best $m$ we can stop:

@code[problem-0004:no_smaller_m_from]

Putting it all together:

@code[problem-0004:FilteredSearch,largest_palindrome_product_fermat_filtered,find_smallest_m,smallest_m_for_sum]

The rules only hold while the upper half starts with $999$, i.e. for $s \le 10^{n-3}$, and the tail has $k = \min(n, \lceil n/2 \rceil + 3, 18)$ digits, which is deeper than any answer has been. If the search can't prove its best palindrome is the largest within those limits, it falls back to the plain Fermat search. That only happens for 5 digits or fewer, where the plain search is fast anyway.

Benchmarking `largest_palindrome_product_fermat_filtered(12)` we find the answer in @benchmark[problem-0004:fermat_filtered_12_digits], which is @ratio[problem-0004:fermat_12_digits/fermat_filtered_12_digits] faster than the plain Fermat search, and the 15-digit case takes @benchmark[problem-0004:fermat_filtered_15_digits], which is @ratio[problem-0004:fermat_15_digits/fermat_filtered_15_digits] faster.
