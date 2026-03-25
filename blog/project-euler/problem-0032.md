---
layout: "project-euler-post"
problem_number: 32
problem_name: "Pandigital Products"
date: 2026-01-12
difficulty: 2
benchmark_file: "problem-0032"
benchmark_key: "pandigital_9"
---

> We shall say that an $n$-digit number is pandigital if it makes use of all the digits $1$ to $n$ exactly once; for example, the $5$-digit number, $15234$, is $1$ through $5$ pandigital.
>
> The product $7254$ is unusual, as the identity, $39 \times 186 = 7254$, containing multiplicand, multiplier, and product is $1$ through $9$ pandigital.
>
> Find the sum of all products whose multiplicand/multiplier/product identity can be written as a $1$ through $9$ pandigital.
>
> HINT: Some products can be obtained in more than one way so be sure to only include it once in your sum.

We'll solve the more general problem of finding all products whose $a \times b = c$ identity is $1$ through $N$ pandigital, where $4 \le N \le 9$.

For a multiplicand $a$ with $d_a$ digits, multiplier $b$ with $d_b$ digits, and product $c$ with $d_c$ digits, we need $d_a + d_b + d_c = N$ to have exactly $N$ digits in total.

The product of a $d_a$-digit number and a $d_b$-digit number has either $d_a + d_b - 1$ or $d_a + d_b$ digits. So we only need to check cases where $d_a + d_b - 1 \le d_c \le d_a + d_b$.

Combining these constraints and requiring $d_a \le d_b$ to avoid counting symmetric cases like $39 \times 186$ and $186 \times 39$ twice, we can tabulate the valid digit distributions for each $N$:

```julia
function get_valid_digit_cases(n)
    cases = Tuple{Int,Int,Int}[]
    for da in 1:(n - 2)
        for db in da:(n - da - 1)
            dc = n - da - db
            if da + db - 1 <= dc <= da + db
                push!(cases, (da, db, dc))
            end
        end
    end
    return cases
end
```

| $N$ | Valid $(d_a, d_b, d_c)$  |
|-----|--------------------------|
| 4   | $(1, 1, 2)$              |
| 5   | $(1, 2, 2)$              |
| 6   | $(1, 2, 3)$              |
| 7   | $(1, 3, 3)$, $(2, 2, 3)$ |
| 8   | $(1, 3, 4)$, $(2, 2, 4)$ |
| 9   | $(1, 4, 4)$, $(2, 3, 4)$ |

For $N = 9$ we have two cases: either the multiplicand is 1 digit and the multiplier is 4 digits (like $4 \times 1738 = 6952$), or the multiplicand is 2 digits and the multiplier is 3 digits (like $39 \times 186 = 7254$).

To check if $a$, $b$, and $c$ together form a $1$-$N$ pandigital, we'll use cheap bitmasks instead of expensive strings. Each digit $d$ sets bit $d-1$ in a result mask. If any digit is 0, or if we see a digit twice (the bit is already set), the check fails. At the end, a valid $1$-$N$ pandigital should have all bits from 0 to $N-1$ set, which equals $(1 \ll N) - 1$.

```julia
@inline function is_pandigital_product(a, b, c, target_mask)
    result = 0
    for n in (a, b, c)
        while n > 0
            digit = n % 10
            digit == 0 && return false
            bit = 1 << (digit - 1)
            (result & bit) != 0 && return false
            result |= bit
            n ÷= 10
        end
    end
    return result == target_mask
end
```

Now we iterate through each valid digit distribution case. For each case, we search through all possible values of $a$ and $b$ within their digit bounds. We can tighten the bounds on $b$ to ensure $c = ab$ has exactly $d_c$ digits. When $d_a = d_b$, we start $b$ from $a$ to avoid symmetric duplicates.

```julia
@inline function digit_bounds(d)
    return (10^(d - 1), 10^d - 1)
end

function find_pandigital_products(n)
    @assert 4 <= n <= 9 "n must be between 4 and 9"

    products = Set{Int}()
    target_mask = (1 << n) - 1

    for (da, db, dc) in get_valid_digit_cases(n)
        (a_min, a_max) = digit_bounds(da)
        (b_min, b_max) = digit_bounds(db)
        (c_min, c_max) = digit_bounds(dc)

        for a in a_min:a_max
            # Tighten b bounds to ensure c has exactly dc digits
            b_lo = max(b_min, cld(c_min, a))
            b_hi = min(b_max, fld(c_max, a))

            # When da == db, start b from a to avoid (a,b)/(b,a) duplicates
            da == db && (b_lo = max(b_lo, a))

            for b in b_lo:b_hi
                c = a * b
                if c_min <= c <= c_max && is_pandigital_product(a, b, c, target_mask)
                    push!(products, c)
                end
            end
        end
    end

    return sum(products)
end
```

We use a `Set` to collect products since the problem warns that some products can be obtained in multiple ways. For example, $5796 = 12 \times 483 = 42 \times 138$.

This solves the original problem in @benchmark[problem-0032:pandigital_9]. We can also test smaller values of $N$:

| $N$ | Sum    | Time                                  |
|-----|--------|---------------------------------------|
| 4   | 12     | @benchmark[problem-0032:pandigital_4] |
| 5   | 52     | @benchmark[problem-0032:pandigital_5] |
| 6   | 162    | @benchmark[problem-0032:pandigital_6] |
| 7   | 0      | @benchmark[problem-0032:pandigital_7] |
| 8   | 13,458 | @benchmark[problem-0032:pandigital_8] |
| 9   |        | @benchmark[problem-0032:pandigital_9] |
