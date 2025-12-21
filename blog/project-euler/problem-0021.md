---
layout: "project-euler-post"
problem_number: 21
problem_name: "Amicable Numbers"
date: 2025-12-15
difficulty: 5
benchmark_file: "problem-0021"
benchmark_key: "limit_10k"
---

> Let $d(n)$ be defined as the sum of proper divisors of $n$ (numbers less than $n$ which divide evenly into $n$).
>
> If $d(a) = b$ and $d(b) = a$, where $a \ne b$, then $a$ and $b$ are an amicable pair and each of $a$ and $b$ are called amicable numbers.
>
> For example, the proper divisors of $220$ are $1, 2, 4, 5, 10, 11, 20, 22, 44, 55$ and $110$; therefore $d(220) = 284$. The proper divisors of $284$ are $1, 2, 4, 71$ and $142$; so $d(284) = 220$.
>
> Evaluate the sum of all the amicable numbers under $10000$.

Rather than computing the sum of proper divisors for each number individually, we can use a sieve to precompute them all at once. This runs in $O(n \log n)$ time rather than $O(n\sqrt{n})$ for the naive approach.

```julia
function sum_proper_divisors_sieve(limit)
    sums = ones(Int, limit)  # Start with 1 as a proper divisor for n ≥ 2
    sums[1] = 0              # 1 has no proper divisors
    for i in 2:(limit ÷ 2)
        for j in (2 * i):i:limit
            sums[j] += i
        end
    end
    return sums
end
```

The sieve works by iterating through each potential divisor $i$ and adding it to all of its multiples. This is similar to the Sieve of Eratosthenes we used in [Problem 10](/blog/project-euler/problem-0010/) but instead of marking composites, we accumulate divisor sums.

With the base sieve implemented, we can check for amicable pairs using simple array lookups:

```julia
function sum_of_amicable_numbers(limit)
    divisor_sums = sum_proper_divisors_sieve(limit)
    total = 0
    for a in 2:(limit - 1)
        b = divisor_sums[a]
        if b != a && b >= 1 && b <= limit && divisor_sums[b] == a
            total += a
        end
    end
    return total
end
```

Using this we compute the answer for limits up to $10^8$, tabulated below.

| Limit   | Sum         | Time |
|---------|-------------|------|
| $10^4$  |             | @benchmark[problem-0021:limit_10k]  |
| $10^5$  | 852,810     | @benchmark[problem-0021:limit_100k] |
| $10^6$  | 25,275,024  | @benchmark[problem-0021:limit_1M]   |
| $10^7$  | 575,875,320 | @benchmark[problem-0021:limit_10M]  |
