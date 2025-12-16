---
layout: "project-euler-post"
problem_number: 21
problem_name: "Amicable Numbers"
date: 2025-12-15
---

> Let $d(n)$ be defined as the sum of proper divisors of $n$ (numbers less than $n$ which divide evenly into $n$).
>
> If $d(a) = b$ and $d(b) = a$, where $a \ne b$, then $a$ and $b$ are an amicable pair and each of $a$ and $b$ are called amicable numbers.
>
> For example, the proper divisors of $220$ are $1, 2, 4, 5, 10, 11, 20, 22, 44, 55$ and $110$; therefore $d(220) = 284$. The proper divisors of $284$ are $1, 2, 4, 71$ and $142$; so $d(284) = 220$.
>
> Evaluate the sum of all the amicable numbers under $10000$.

First let's define a function that lets us sum the divisors of an integer $n$. This is quite similar to `sum_divisors` from [Problem 12](/blog/project-euler/problem-0012/) and also does not allocate memory.

```julia
function sum_divisors(n)
    total = 0
    sqrt_n = isqrt(n)

    for i in 1:sqrt_n
        if n % i == 0
            total += i + n ÷ i
        end
    end

    if sqrt_n^2 == n
        total -= sqrt_n
    end

    return total
end
```

We can now easily define a function to tell us whether an integer is amicable or not.

```julia
function is_amicable(a)
    b = sum_divisors(a) - a
    return a != b && sum_divisors(b) - b == a
end
```

Then we just need to go through every integer $a$ below the limit and sum up all the amicable numbers we find.

```julia
function sum_of_amicable_numbers(limit)
    total = 0
    for a in 2:(limit - 1)
        if is_amicable(a)
            total += a
        end
    end
    return total
end
```

`sum_of_amicable_numbers(10000)` returns the answer in @benchmark[problem-0021:limit_10k]. We can also compute `sum_of_amicable_numbers(1_000_000)` which returns in @benchmark[problem-0021:limit_1M].
