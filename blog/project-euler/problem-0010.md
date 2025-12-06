---
layout: "project-euler-post"
problem_number: 10
problem_name: "Summation of Primes"
date: 2025-12-05
---

> The sum of the primes below $10$ is $2 + 3 + 5 + 7 = 17$.
>
> Find the sum of all the primes below two million.

This is a perfect problem to solve using the [Sieve of Eratosthenes](https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes) which Wikipedia has a great animation it uses to explain how the sieve works.

Coding it up in Julia

```julia
function sieve_of_eratosthenes(limit)
    is_prime_arr = fill(true, limit)
    is_prime_arr[1] = false

    for i in 2:isqrt(limit)
        if is_prime_arr[i]
            # Mark all multiples of i as non-prime
            for j in (i ^ 2):i:limit
                is_prime_arr[j] = false
            end
        end
    end

    primes = [i for i in 2:limit if is_prime_arr[i]]

    return primes
end

function sum_of_primes_below(limit)
    primes = sieve_of_eratosthenes(limit)
    return sum(primes)
end
```

we can compute the sum of all primes below $2 \times 10^6$ in @benchmark[problem-0010:sum_of_primes_below_2M] using ~5 MiB of memory.

We can go a bit further and compute the sum of all primes below $10^8$ in @benchmark[problem-0010:sum_of_primes_below_100M] using ~237 MiB of memory.

The sieve uses $\mathcal{O}(n)$ space for the boolean array. For time complexity, consider how much work we do crossing off multiples. For each prime $p$, we cross off roughly $n/p$ multiples. The total work is

```math
\frac{n}{2} + \frac{n}{3} + \frac{n}{5} + \frac{n}{7} + \cdots = n \left( \frac{1}{2} + \frac{1}{3} + \frac{1}{5} + \cdots \right).
```

The [sum of reciprocals of primes](https://en.wikipedia.org/wiki/Divergence_of_the_sum_of_the_reciprocals_of_the_primes) up to $n$ grows like $\log \log n$, giving us $\mathcal{O}(n \log \log n)$ time complexity.
