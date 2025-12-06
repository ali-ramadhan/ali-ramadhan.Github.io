---
layout: "project-euler-post"
bonus_problem: true
bonus_problem_number: 2
problem_name: "√13"
date: 2024-12-05
---

> The decimal expansion of the square root of two is $1.\underline{4142135623}730...$
>
> If we define $S(n, d)$ to be the the sum of the first $d$ digits in the fractional part of the decimal expansion of $\sqrt{n}$, it can be seen that $S(2, 10) = 4 + 1 + 4 + ... + 3 = 31$.
>
> It can be confirmed that $S(2, 100) = 481$.
>
> Find $S(13, 1000)$.
>
> **Note**: Instead of just using arbitrary precision floats, try to be creative with your method.

## The uncreative solution

First let's solve this the boring way. We'll use arbitrary precision floats to compute $\sqrt{n}$ with enough precision to get the first $d$ digits correct, then convert the fractional part to a string and sum the digits. We need $\log_2(10)$ bits to represent a base-10 digit, so adding an extra couple of digits to be safe in total we will need $(d + 2) \log_2(10)$ bits of precision.

```julia
function S_not_creative(n, d)
    precision_bits = ceil(Int, (d + 2) * log2(10))
    setprecision(BigFloat, precision_bits) do
        val = sqrt(big(n))
        frac_digits_str = split(string(val), '.')[2][1:d]
        return sum(parse(Int, c) for c in frac_digits_str)
    end
end
```

Using this we can compute $S(13, 10^3)$ in @benchmark[problem-bonus-root13:S_not_creative_13_1000].

## Going digit-by-digit

So the problem doesn't want us to use arbitrary precision floats, but we can use arbitrary precision integer arithmetric to compute each digit of the square root's fractional part one-by-one by using a [method that is similar to long division](https://en.wikipedia.org/wiki/Square_root_algorithms#Digit-by-digit_calculation).

We can compute the [integer square root](https://en.wikipedia.org/wiki/Integer_square_root) of $n$ using Julia's `isqrt` function. Doing this for $n = 13$ we then know that $\sqrt{13} = 3.\text{something}$.

Now we can start building the fractional digits one-by-one. To find the first decimal digit we need to look for the largest digit $d_1$ such that $(3.d_1)^2 \le 13$. This is equivalent to finding the largest $d_1$ such that

```math
\left(3 + \frac{d_1}{10}\right)^2 \le 13 \implies d_1(60 + d_1) \le 400
```

Iterating through the 10 possible digits we find that $d_1 = 6$. So the first decimal digit is $\mathbf{6}$, and $\sqrt{13} = 3.6\text{something}$. To find the second digit we again look for the largest $d_2$ such that $(3.6d_2)^2 \le 13$:

```math
\left(3.6 + \frac{d_2}{100}\right)^2 \le 13 \implies d_2(720 + d_2) \le 400
```

and so $d_2 = 0$ and $\sqrt{13} = 3.60\text{something}$ so we've found the first two digits.

We can keep going but let's generalize what we're doing here.

## The creative solution

Instead of keeping track of the quotient with $k$ digits $q_k$ (so far we have found that $q_0 = 3$, $q_1 = 3.6$, and $q_2 = 3.60$ in our case) we will keep track of a scaled integer version $p_k = 10^k q_k$ which will always be a non-negative integer (so $p_0 = 3$, $p_1 = 36$, and $p_2 = 360$ in our case).

It will also be helpful to denote the _remainder_ as the difference between $n$ and the square of our best quotient so far $q_k^2$. That would just be $r_k = n - q_k^2$ but we'll define a scaled integer version. As $q_k^2 = p_k^2 / 10^{2k}$ we will scale $r_k$ by $10^{2n}$ and denote the scaled version $R_k$ so $R_k = 10^{2k} n - p_k^2$ is always an integer as well.

Then to find the next digit $d_k$ when we have a quotient with $k-1$ digits $q_{k-1}$ we have the inequality

```math
\left( q_{k-1} + \frac{d_k}{10^k} \right)^2 \leq n \implies (10^k q_{k-1} + d_k)^2 \leq 10^{2k} n
```

but $p_{k-1} = 10^{k-1} q_{k-1}$ so we can rewrite the inequality using only integers now

```math
(10 p_{k-1} + d_k)^2 \leq 10^{2k} n \implies d_k (20p_{k-1} + d_k) \leq 10^{2k} n - 100 p_{k-1}^2
```

and now we can rewrite the right hand side using the fact that $R_{k-1} = 10^{2(k-1)} n - p_{k-1}^2$ to get

```math
d_k (20 p_{k-1} + d_k) \leq 100 R_{k-1}
```

So starting with $p_0 = \operatorname{isqrt}(n)$ and $R_0 = n - p_0^2$ we can iteratively find the largest $d_k$ that satisfies the above inequality then compute $p_k$ and $R_k$ using

```math
\begin{align}
  p_k &= 10p_{k-1} + d_k \\
  R_k &= 10^{2k} n - p_k^2
\end{align}
```

but it will be computationally cheaper to compute $R_k$ using

```math
R_k = 100 R_{k-1} - d_k(20 p_{k-1} + d_k)
```

directly from the inequality. This can be computed from leftovers we already have and we no longer have to keep track of $k$.


## Implementation and benchmarking

We can code up our "creative solution" as

```julia
function compute_sqrt_digits(n, num_decimal_digits)
    integer_part = isqrt(n)

    R = BigInt(n - integer_part * integer_part)
    p = BigInt(integer_part)

    digits = Int[]

    for _ in 1:num_decimal_digits
        R *= 100

        d = 0

        for digit in 0:9
            test_divisor = 20 * p + digit
            test_product = test_divisor * digit

            if test_product <= R
                d = digit
            else
                break
            end
        end

        divisor = 20 * p + d
        R -= divisor * d
        p = p * 10 + d

        push!(digits, d)
    end

    return digits
end

function sum_sqrt_decimal_digits(n, num_digits)
    digits = compute_sqrt_digits(n, num_digits)
    return sum(digits)
end
```

which computes $S(13, 10^3)$ in @benchmark[problem-bonus-root13:S_13_1000]. But damn that's like 150x slower than the uncreative solution!

| $d$     | Uncreative | Creative |
|---------|------------|----------|
| $10^3$  | @benchmark[problem-bonus-root13:S_not_creative_13_1000] | @benchmark[problem-bonus-root13:S_13_1000] |
| $10^4$  | @benchmark[problem-bonus-root13:S_not_creative_13_10000] | @benchmark[problem-bonus-root13:S_13_10000] |
| $10^5$  | @benchmark[problem-bonus-root13:S_not_creative_13_100000] | @benchmark[problem-bonus-root13:S_13_100000] |

Both solutions agree that $S(13, 10^4) = 45,101$ and $S(13, 10^5) = 449,304$.

## Computational complexity

The slowdown gets worse as $d$ increases (~150× at $d = 10^3$, ~1000× at $d = 10^5$).

With the creative solution we perform $d$ iterations, and at iteration $k$ we're working with integers that have $k$ digits. `BigInt` operations on $k$-digit integers cost $\mathcal{O}(k)$ time. Since $1 \leq k \leq d$ in total that's $\mathcal{O}(d^2)$ time.

With the uncreative solution the `BigFloat` square root algorithm probably uses something like [Newton-Raphson iteration](https://en.wikipedia.org/wiki/Newton%27s_method#Use_of_Newton's_method_to_compute_square_roots) which converges _quadratically_ with each iteration roughly doubling the number of correct digits. So we only need $\mathcal{O}(\log d)$ iterations to get $d$ correct digits. Julia's `BigFloat` uses the [GNU MPFR library](https://www.mpfr.org/) which in turn uses [GMP](https://gmplib.org/) for arithmetic. For large numbers, GMP uses the [Schönhage-Strassen algorithm](https://en.wikipedia.org/wiki/Sch%C3%B6nhage%E2%80%93Strassen_algorithm) which multiplies $d$-digit numbers in $\mathcal{O}(d \log d \log \log d)$ time. The overall complexity is then $\mathcal{O}(d \log^2 d \log \log d)$. In addition to fewer memory allocations, this makes the uncreative solution much faster.
