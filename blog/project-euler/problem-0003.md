---
layout: "project-euler-post"
problem_number: 3
problem_name: "Largest Prime Factor"
date: 2025-09-14
difficulty: 5
benchmark_file: "problem-0003"
benchmark_key: "problem"
---

> The prime factors of $13195$ are $5, 7, 13$ and $29$.
>
> What is the largest prime factor of the number $600851475143$?

We want to find the largest prime factor of a given integer $n$.

There are plenty of algorithms for [integer factorization](https://en.wikipedia.org/wiki/Integer_factorization) but since the numbers here aren't too large, we'll just use [trial division](https://en.wikipedia.org/wiki/Trial_division).

We just keep dividing by 2, then by 3, 5, 7, and so on. And each time we're able to divide $n$ we have found another prime factor. And each time we find one factor $d$, we now only have to search for prime factors of $n/d$ so we've knocked down the size of the problem. When searching for a factor, there's no need to search beyond $\sqrt{n}$ because if there are no factors of $n$ smaller than $\sqrt{n}$ then $n$ is prime.

We can implement trial division in Julia:

```julia
function prime_factors(n)
    factors = Int[]

    # Divide by 2 as much as possible.
    while n % 2 == 0
        push!(factors, 2)
        n ÷= 2
    end

    # Handle odd factors.
    factor = 3
    while factor^2 <= n
        while n % factor == 0
            push!(factors, factor)
            n ÷= factor
        end
        factor += 2
    end

    # If we're out of divisors, then n itself is a prime factor.
    if n > 1
        push!(factors, n)
    end

    return factors
end

function largest_prime_factor(n)
    return maximum(prime_factors(n))
end
```

Benchmarking `largest_prime_factor(600851475143)` to solve the problem we get @benchmark[problem-0003:problem] which is more than fast enough for this problem.

If the number is made up of only small factors then `prime_factors` will take very little time. In the worst case, $n$ could be prime or semiprime and trial division will end up checking many factors. Finding the largest prime factor of a cool prime I found, $2^{55} - 55$ takes @benchmark[problem-0003:cool_prime]. And for the semiprime $268435399 \times 536870923$ it takes @benchmark[problem-0003:semiprime]. That's 100,000x longer in both cases compared to solving the original problem.

The runtime of `prime_factors` can vary wildly. In the best case when $n$ just has many small factors that are quickly found it runs in $\mathcal{O}(\log n)$ time. But in the worst case trial division will end up testing all odd divisors up to $\sqrt{n}$ so it'll take $\mathcal{O}(\sqrt{n})$ time.

As implemented, our algorithm uses $\mathcal{O}(\log n)$ space to keep track of all factors of $n$ but since we only care about the largest prime factor we could just track it using $\mathcal{O}(1)$ or constant space.
