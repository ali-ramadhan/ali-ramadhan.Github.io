---
layout: "project-euler-post"
problem_number: 14
problem_name: "Longest Collatz Sequence"
date: 2025-12-07
difficulty: 5
benchmark_file: "problem-0014"
benchmark_key: "longest_collatz_under_1M"
---

> The following iterative sequence is defined for the set of positive integers:
>
> <ul style="list-style-type:none;">
> <li>$n \to n/2$ ($n$ is even)</li>
> <li>$n \to 3n + 1$ ($n$ is odd)</li>
> </ul>
>
> Using the rule above and starting with $13$, we generate the following sequence:
>
> $$13 \to 40 \to 20 \to 10 \to 5 \to 16 \to 8 \to 4 \to 2 \to 1.$$
>
> It can be seen that this sequence (starting at $13$ and finishing at $1$) contains $10$ terms. Although it has not been proved yet (Collatz Problem), it is thought that all starting numbers finish at $1$.
>
> Which starting number, under one million, produces the longest chain?
>
> **NOTE:** Once the chain starts the terms are allowed to go above one million.

It's not hard to code up a function that computes the length of the Collatz sequence for a specific integer, but computing the chain lengths of millions of numbers can take a while and involve lots of repetitive computation.

To speed things up we can use [memoization](https://en.wikipedia.org/wiki/Memoization). We use a cache (just a dictionary) and store the chain length of any integer once we compute it. Then when we encounter that integer again, we just pull out the known chain length. This way we never repeat a chain length computation.

```julia
function collatz_length(n, cache)
    if n == 1
        return 1
    end

    if haskey(cache, n)
        return cache[n]
    end

    if n % 2 == 0
        length = 1 + collatz_length(n ÷ 2, cache)
    else
        length = 1 + collatz_length(3n + 1, cache)
    end

    cache[n] = length
    return length
end

function longest_collatz_under(limit)
    cache = Dict(1 => 1)

    max_length = 0
    max_start = 0

    for start in 1:(limit - 1)
        length = collatz_length(start, cache)
        if length > max_length
            max_length = length
            max_start = start
        end
    end

    return max_start, max_length
end
```

We find the solution in @benchmark[problem-0014:longest_collatz_under_1M].

Under $10^7$ we find that 8400511 produces the longest chain (686 terms) in @benchmark[problem-0014:longest_collatz_under_10M]. Under $10^8$ we find that 63728127 produces the longest chain (950 terms) in @benchmark[problem-0014:longest_collatz_under_100M]. Both agree with the list of starting values that produce the longest chains on [Wikipedia](https://en.wikipedia.org/wiki/Collatz_conjecture). We (and Project Euler) are counting the number of terms while Wikipedia is counting the number of steps/transitions so our chain lengths are longer by one.
