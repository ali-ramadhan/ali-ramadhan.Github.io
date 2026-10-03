---
layout: "project-euler-post"
problem_number: 4
problem_name: "Largest Palindrome Product"
date: 2025-10-07
benchmark_file: "problem-0004"
benchmark_key: "fermat_3_digits"
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

@code[problem-0004:largest_palindrome_product_pruned]

So we search through all products $ij$ in descending order to find the largest palindrome. The search is sped up in a few ways. First, we iterate from largest to smallest values since we're searching for a maximum. This lets us prune the search, terminating early once $ij$ can no longer exceed the current maximum palindrome found so far. We also added a `max_product` option that only considers products below a given value, which is what the [HackerRank version](https://www.hackerrank.com/contests/projecteuler/challenges/euler004/problem) asks for. With up to $100$ queries per run though, the [submission](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl/blob/main/hacker_rank/projecteuler+_problem0004.jl) instead precomputes every palindrome product of two $3$-digit numbers once and binary searches that sorted list for each query.

Benchmarking the 3-digit case we find the solution `largest_palindrome_product_pruned(3)` in @benchmark[problem-0004:pruned_3_digits], which is @ratio[problem-0004:naive_3_digits/pruned_3_digits] faster than the naive solution.

For the 6-digit case we call `largest_palindrome_product_pruned(6)` to find a maximum palindrome of $999,000,000,999 = 999,001 \times 999,999$ in @benchmark[problem-0004:pruned_6_digits].

The 8-digit case takes @benchmark[problem-0004:pruned_8_digits]. We can still do the 9-digit case, where `largest_palindrome_product_pruned(9)` finds $999,900,665,566,009,999 = 999,920,317 \times 999,980,347$, but that takes almost a minute.

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

`uv_max` keeps both factors at $n$ digits, and the inner loop tries carries until $D$ goes negative. This search can't miss a factorization because every way of writing a palindrome as a product of two $n$-digit numbers gives some $u$, $v$, and $c \ge 0$ that satisfy both equations, and for that carry $D = (u - v)^2 \ge 0$, so it gets tested before the loop stops. And since the palindromes get smaller as $m$ grows, the first one that passes is the largest.

This is [Fermat's factorization method](https://en.wikipedia.org/wiki/Fermat%27s_factorization_method) in disguise. Fermat factors a number $N$ by looking for an $a$ that makes $a^2 - N$ a perfect square $b^2$, because then $N = (a - b)(a + b)$. It's fast when the two factors are close together. Here $x + y = 2B - (m + c)$, so our discriminant is $D = (x + y)^2 - 4xy = (x - y)^2$, which is the same test with $a = (x + y)/2$. The digits of the palindrome pin down $x + y$ to one candidate per carry, and both factors are within about $10^{n/2}$ of $10^n$.

Benchmarking `largest_palindrome_product_fermat(8)` we find the answer in @benchmark[problem-0004:fermat_8_digits], which is @ratio[problem-0004:pruned_8_digits/fermat_8_digits] faster than the pruned search. For the original 3-digit problem it takes @benchmark[problem-0004:fermat_3_digits], which is @ratio[problem-0004:pruned_3_digits/fermat_3_digits] faster. The 12-digit case, which would take many hours by searching products runs in @benchmark[problem-0004:fermat_12_digits], and the 15-digit case runs in @benchmark[problem-0004:fermat_15_digits].

## Skipping palindromes that can't be products

The Fermat search reverses the upper half of every palindrome and then computes a discriminant and an integer square root for every carry it tries. But most palindromes can be ruled out by looking at just a few of their digits, before doing any of that work, and the ones that are left can be checked more cheaply.

Let $s = u + v = m + c$. Near the top, the upper half starts with $999$, so the palindrome ends in $999$. The lower half is $uv - cB$ and $B = 10^n$ is a multiple of $1000$, so $uv$ ends in $999$ as well. That tells us a lot about $s$.

First, $uv$ ends in $9$, so $u$ and $v$ end in $1$ and $9$, $3$ and $3$, or $7$ and $7$. So $s$ ends in $0$, $6$ or $4$. Second, $uv \equiv 999 \equiv 7 \pmod 8$, so $u$ and $v$ are both odd. The residue of a number modulo $k$ is its remainder after dividing by $k$. The only odd residues modulo $8$ that multiply to $7$ are $1 \times 7$ and $3 \times 5$. Both add up to $8$, so $s \equiv 0 \pmod 8$.

These rules are about $s$ rather than $m$, so we'll loop over $s$ instead and set $m = s - c$ for each carry.

Both rules only depend on $s \bmod 8$ and $s \bmod 10$, which repeat every $40$ sums since $40$ is the smallest number that $8$ and $10$ both divide. Of $0, 1, \dots, 39$, only $0$, $16$ and $24$ pass, so of any $40$ consecutive sums only the ones congruent to those modulo $40$ can work. So rather than testing every $s$, we can step through the sums in blocks of $40$ and only try those three, skipping the other $37$ without doing any work.

In blocks of $120$ the same rules allow these residues:

@code[problem-0004:SUM_RESIDUES]

Blocks of $40$ would keep the same $3$ in $40$ sums, but since $40 \equiv 1 \pmod 3$, the same residue would give a different $s \bmod 3$ in each of three consecutive blocks. In blocks of $120 = 8 \times 3 \times 5$ each residue also fixes $s \bmod 3$, so the next rule can drop whole residues instead of checking every sum.

A number is congruent to its digit sum modulo $3$, and the upper and lower halves have the same digits, so $L \equiv U \pmod 3$. Since $B = 10^n \equiv 1 \pmod 3$ and $U = B - m = B - s + c$, the discriminant becomes

```math
D = s^2 - 4(cB + L) \equiv s^2 + s + c - 1 \pmod 3
```

A perfect square is always $0$ or $1$ modulo $3$, so we can skip any $s$ and $c$ that make this $2$. Here `r` is $s \bmod 120$:

@code[problem-0004:passes_mod_3_rule]

Without a carry that only leaves $s \equiv 1 \pmod 3$, i.e. $s \equiv 16$, $40$ or $64 \pmod{120}$. And there can't be a carry while $s^2 < 4B$, since $cB \le uv \le s^2/4$. So near the top only $1$ in $40$ values of $s$ needs checking.

The middle of the palindrome narrows it down even further. The last digit of $U$ is $d = (c - s) \bmod 10$, and it's also the first digit of $L$, so $L \ge d \times 10^{n-1}$. For $D \ge 0$ we need $s^2 \ge 4(cB + L)$, so we can check $s^2 \ge 4(cB + d \times 10^{n-1})$ before working out $L$ at all:

@code[problem-0004:passes_middle_digit_rule]

The palindromes that get through can also be checked more cheaply:

- Near the top the upper half is a run of $9$s followed by a short tail, so the lower half is the reversed tail followed by $9$s, and only the tail needs reversing. Reversing takes a division per digit, and once the numbers need `Int128` those divisions are slow, but the tail always fits in an `Int64`.
- Only $12$ of the $64$ residues modulo $64$ are perfect squares, so checking $D \bmod 64$ against a 64-bit mask first rules out about $81\%$ of the non-squares before taking the square root.
- Julia turns `s^2` into `s * s` for integers up to 64 bits, but for `Int128` it calls the generic `power_by_squaring`, so we write `s * s` ourselves.

@code[problem-0004:lower_half,reverse_tail,SQUARES_MOD_64,perfect_square_root]

Looping over $s$ has one catch: we no longer visit the palindromes in order, since a larger $s$ with a larger carry can still give a smaller $m$. So instead of stopping at the first hit, we keep the smallest $m$ found so far. The carry is at most $s^2/4B$, so every $s$ from here on gives $m \ge s - \lfloor s^2/4B \rfloor$, and once that's larger than the best $m$ we can stop:

@code[problem-0004:no_smaller_m_from]

Putting it all together:

@code[problem-0004:FilteredSearch,largest_palindrome_product_fermat_filtered,find_smallest_m,smallest_m_for_sum]

The rules only hold while the upper half starts with $999$, i.e. for $s \le 10^{n-3}$, and the tail has $k = \min(n, \lceil n/2 \rceil + 3, 18)$ digits, which is deeper than any answer has been. If the search can't prove its best palindrome is the largest within those limits, it falls back to the plain Fermat search. That only happens for 5 digits or fewer, where the plain search is fast anyway.

Benchmarking `largest_palindrome_product_fermat_filtered(12)` we find the same answer in @benchmark[problem-0004:fermat_filtered_12_digits], which is @ratio[problem-0004:fermat_12_digits/fermat_filtered_12_digits] faster than the plain Fermat search, and the 15-digit case takes @benchmark[problem-0004:fermat_filtered_15_digits], which is @ratio[problem-0004:fermat_15_digits/fermat_filtered_15_digits] faster.

## Running the search on a GPU

The filtered search still checks one sum at a time. The answer is usually around $10^{n/2}$ palindromes from the top, so each extra digit means about $\sqrt{10} \approx 3$ times as many sums to check. But checking one sum doesn't depend on any other, and all we need from them is the smallest $m$, so we can check many sums at the same time. It's an embarassingly parallel problem. That's what GPUs are good at!

Each GPU thread can take groups of $120$ consecutive sums, like the blocks in `find_smallest_m`, and checks the ones whose residues pass the rules. When a thread finds a palindrome product, it lowers the smallest $m$ found so far with `CUDA.@atomic`, so that two threads can't overwrite each other's results:

@code[problem-0004:search_kernel!,check_group!,check_sum!,passes_middle_digit_rule_gpu]

Each thread loops over every `num_threads`-th group, so the kernel can be launched on any number of groups. Rather than testing every residue against the rules, `check_group!` uses two thresholds: below the first only $s \equiv 40$ can pass, and below the second there's no carry yet, so only $16$, $40$ and $64$ can. `check_sum!` also keeps $4cB$ as a running total instead of multiplying for every carry, which is the only change in `passes_middle_digit_rule_gpu`.

The CPU decides how far to search. It launches the kernel on batches of groups from $s = 0$ upwards, doubling the batch each time, so an answer near the top only takes a few small launches while a deep one gets launches big enough to keep the GPU busy. After each launch it copies back the smallest $m$ and stops once no larger $s$ can beat it, using `no_smaller_m_from` again:

@code[problem-0004:largest_palindrome_product_gpu]

The GPU only reports $m$, so `palindrome_and_factors` then works out the carry and the two factors on the CPU. There's no fallback to the plain search, so the GPU version needs at least 6 digits.

The arithmetic takes more care on a GPU. Its integer instructions work on 32 bits, so 64-bit arithmetic takes a few instructions and 128-bit arithmetic many more, and division, which the hardware can't do directly, is the slowest of all.

@code[problem-0004:GPUSearch]

Two pieces of the CPU code are also rewritten to avoid slow arithmetic. Reversing the tail takes a division by $10$ per digit, so `reverse_tail_gpu` splits the tail into its last $9$ digits and the rest, which both fit in 32 bits. That makes the whole search about 1.5× faster than dividing a `UInt64`. And Base's `isqrt` corrects its floating-point estimate with a Newton step that divides one `UInt128` by another, which makes the whole search about 6× slower. So `isqrt_uint128` corrects the estimate by comparing squares instead, which only needs multiplications:

@code[problem-0004:lower_half_gpu,reverse_tail_gpu,reverse_last_digits,is_perfect_square,isqrt_uint128]

The residue rules don't change, so the GPU code reuses `SUM_RESIDUES`, `passes_mod_3_rule` and `SQUARES_MOD_64` from the CPU version.

On a GPU the 20-digit case takes @benchmark[problem-0004:gpu_20_digits], which is @ratio[problem-0004:fermat_filtered_20_digits/gpu_20_digits] faster than the filtered search on one CPU core, and the 24-digit case takes @benchmark[problem-0004:gpu_24_digits].

That's fast enough to keep going past 24 digits!

The `UInt128` arithmetic works up to 37 digits, where $4B$ stops fitting, but each digit makes the search about $\sqrt{10}$ times longer. With an even number of digits the answer is at most $10^{n/2}$ palindromes from the top, so 32 digits takes up to about an hour, while an odd number of digits can take longer, depending on how far down the answer is.

## Every answer up to 32 digits

Here's the largest palindrome that's a product of two $n$-digit numbers for every $n$ from $2$ to $32$. These are [OEIS A327897](https://oeis.org/A327897), and each one has just one factorization into two $n$-digit numbers:

| $n$ | Largest palindrome and its factors                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | 9009<br>= 91 × 99                                                                                                                         |
| 3   | 906609<br>= 913 × 993                                                                                                                     |
| 4   | 99000099<br>= 9901 × 9999                                                                                                                 |
| 5   | 9966006699<br>= 99681 × 99979                                                                                                             |
| 6   | 999000000999<br>= 999001 × 999999                                                                                                         |
| 7   | 99956644665999<br>= 9997647 × 9998017                                                                                                     |
| 8   | 9999000000009999<br>= 99990001 × 99999999                                                                                                 |
| 9   | 999900665566009999<br>= 999920317 × 999980347                                                                                             |
| 10  | 99999834000043899999<br>= 9999986701 × 9999996699                                                                                         |
| 11  | 9999994020000204999999<br>= 99999943851 × 99999996349                                                                                     |
| 12  | 999999000000000000999999<br>= 999999000001 × 999999999999                                                                                 |
| 13  | 99999963342000024336999999<br>= 9999996340851 × 9999999993349                                                                             |
| 14  | 9999999000000000000009999999<br>= 99999990000001 × 99999999999999                                                                         |
| 15  | 999999974180040040081479999999<br>= 999999975838971 × 999999998341069                                                                     |
| 16  | 99999999000000000000000099999999<br>= 9999999900000001 × 9999999999999999                                                                 |
| 17  | 9999999887065624224265607889999999<br>= 99999999127775321 × 99999999742880919                                                             |
| 18  | 999999999470552640046255074999999999<br>= 999999999580927521 × 999999999889625119                                                         |
| 19  | 99999999988837057200275073888999999999<br>= 9999999999250922661 × 9999999999632783059                                                     |
| 20  | 9999999999694448232002328444969999999999<br>= 99999999998397393961 × 99999999998547088359                                                 |
| 21  | 999999999879175245666666542571978999999999<br>= 999999999908232994097 × 999999999970942251567                                             |
| 22  | 99999999999523989457200275498932599999999999<br>= 9999999999959141742661 × 9999999999993257203059                                         |
| 23  | 9999999999949562831433663341382659499999999999<br>= 99999999999731804264433 × 99999999999763824049903                                     |
| 24  | 999999999999000000000000000000000000999999999999<br>= 999999999999000000000001 × 999999999999999999999999                                 |
| 25  | 99999999999994430707230000003270703449999999999999<br>= 9999999999999449006736499 × 9999999999999994063986501                             |
| 26  | 9999999999999000000000000000000000000009999999999999<br>= 99999999999990000000000001 × 99999999999999999999999999                         |
| 27  | 999999999999955442218541064460145812244559999999999999<br>= 999999999999971704203097837 × 999999999999983738015443227                     |
| 28  | 99999999999999000000000000000000000000000099999999999999<br>= 9999999999999900000000000001 × 9999999999999999999999999999                 |
| 29  | 9999999999999986089752785964004695872579806899999999999999<br>= 99999999999999918553308533619 × 99999999999999942344219326021             |
| 30  | 999999999999999000000000000000000000000000000999999999999999<br>= 999999999999999000000000000001 × 999999999999999999999999999999         |
| 31  | 99999999999999997729870486170000007168407892779999999999999999<br>= 9999999999999999810893840902251 × 9999999999999999962093207714749     |
| 32  | 9999999999999999000000000000000000000000000000009999999999999999<br>= 99999999999999990000000000000001 × 99999999999999999999999999999999 |

[OEIS A308803](https://oeis.org/A308803) asks the same question by the number of digits in the palindrome instead: the largest $k$-digit palindrome that's a product of two numbers with the same number of digits. For even $k$ that's the table above, since a $2n$-digit product needs two $n$-digit factors. For odd $k$ the two factors can be much further apart, which makes those terms easy to find, and they're known up to $95$ digits.

## How far each method gets

Here's every benchmark from this post in one table. Each method is only benchmarked at sizes it can do in a few seconds, and it shares at least two sizes with the method before it. Under each time is how many times faster that method is than the one to its left. The CPU searches all run on one core.

::: wide-table

| $n$ | Naive                                   | Pruned                                                                                                 | Fermat                                                                                                  | Filtered                                                                                                                     | GPU                                                                                                           |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 3   | @benchmark[problem-0004:naive_3_digits] | @benchmark[problem-0004:pruned_3_digits]<br>@ratio[problem-0004:naive_3_digits/pruned_3_digits] faster | @benchmark[problem-0004:fermat_3_digits]<br>@ratio[problem-0004:pruned_3_digits/fermat_3_digits] faster |                                                                                                                              |                                                                                                               |
| 4   | @benchmark[problem-0004:naive_4_digits] | @benchmark[problem-0004:pruned_4_digits]<br>@ratio[problem-0004:naive_4_digits/pruned_4_digits] faster |                                                                                                         |                                                                                                                              |                                                                                                               |
| 6   |                                         | @benchmark[problem-0004:pruned_6_digits]                                                               | @benchmark[problem-0004:fermat_6_digits]<br>@ratio[problem-0004:pruned_6_digits/fermat_6_digits] faster |                                                                                                                              |                                                                                                               |
| 8   |                                         | @benchmark[problem-0004:pruned_8_digits]                                                               | @benchmark[problem-0004:fermat_8_digits]<br>@ratio[problem-0004:pruned_8_digits/fermat_8_digits] faster |                                                                                                                              |                                                                                                               |
| 12  |                                         |                                                                                                        | @benchmark[problem-0004:fermat_12_digits]                                                               | @benchmark[problem-0004:fermat_filtered_12_digits]<br>@ratio[problem-0004:fermat_12_digits/fermat_filtered_12_digits] faster |                                                                                                               |
| 15  |                                         |                                                                                                        | @benchmark[problem-0004:fermat_15_digits]                                                               | @benchmark[problem-0004:fermat_filtered_15_digits]<br>@ratio[problem-0004:fermat_15_digits/fermat_filtered_15_digits] faster | @benchmark[problem-0004:gpu_15_digits]<br>@ratio[problem-0004:fermat_filtered_15_digits/gpu_15_digits] faster |
| 20  |                                         |                                                                                                        |                                                                                                         | @benchmark[problem-0004:fermat_filtered_20_digits]                                                                           | @benchmark[problem-0004:gpu_20_digits]<br>@ratio[problem-0004:fermat_filtered_20_digits/gpu_20_digits] faster |
| 24  |                                         |                                                                                                        |                                                                                                         |                                                                                                                              | @benchmark[problem-0004:gpu_24_digits]                                                                        |
| 26  |                                         |                                                                                                        |                                                                                                         |                                                                                                                              | @benchmark[problem-0004:gpu_26_digits]                                                                        |

:::

Searching palindromes instead of products changes how quickly the time grows. From 6 to 8 digits, the pruned search gets @ratio[problem-0004:pruned_8_digits/pruned_6_digits] slower, but the Fermat search only gets @ratio[problem-0004:fermat_8_digits/fermat_6_digits] slower, since the answer is only around $10^{n/2}$ palindromes from the top. So the palindrome searches only get about $\sqrt{10} \approx 3$ times slower with each extra digit, which makes every later speedup worth a few more digits in the same time: the filters' @ratio[problem-0004:fermat_15_digits/fermat_filtered_15_digits] is worth about 3, and the GPU's @ratio[problem-0004:fermat_filtered_20_digits/gpu_20_digits] about 6.

The filters skip about the same share of the work at every size, so they stay around @ratio[problem-0004:fermat_12_digits/fermat_filtered_12_digits] to @ratio[problem-0004:fermat_15_digits/fermat_filtered_15_digits] faster. The GPU instead pulls further ahead as $n$ grows, since the fixed cost of each kernel launch matters less, going from @ratio[problem-0004:fermat_filtered_15_digits/gpu_15_digits] faster than one CPU core at 15 digits to @ratio[problem-0004:fermat_filtered_20_digits/gpu_20_digits] at 20.
