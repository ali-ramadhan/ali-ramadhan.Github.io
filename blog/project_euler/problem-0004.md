---
layout: "project-euler-post"
problem_number: 4
problem_name: "Largest Palindrome Product"
date: 2024-10-07
---

> A palindromic number reads the same both ways. The largest palindrome made from the product of two $2$-digit numbers is $9009 = 91 \times 99$.
> 
> Find the largest palindrome made from the product of two $3$-digit numbers.

First let's write a function that can quickly test whether an integer $n$ is a palindrome.
This can be done pretty easily and elegantly:

```julia
function is_palindrome(n)
    n = abs(n)  # handle negative numbers
    str(n) == reverse(str(n))
end
```

but this allocates memory for two strings. So when checking lots of large numbers it will be slower than a
purely numerical approach that allocates no memory.

We can instead take a numerical approach where we reverse the number by extracting digits from right to left and rebuilding the number:

```julia
function is_palindrome(n)
    n = abs(n)
    original = n
    reversed = zero(typeof(n))

    while n > 0
        reversed = reversed * 10 + (n % 10)
        n ÷= 10
    end

    return reversed == original
end
```

We can then use this function to search for the largest palindrome made from the product of two numbers
that do not exceed `upper_limit` each:

```julia
function largest_palindrome_product(lower_limit, upper_limit; max_product=nothing)
    T = typeof(upper_limit)
    max_palindrome = zero(T)
    best_i, best_j = zero(T), zero(T)

    for i in upper_limit:-1:lower_limit
        if i * upper_limit < max_palindrome
            break
        end

        # Start from j=i to avoid duplicate combinations as i*j == j*i
        for j in upper_limit:-1:i
            product = i * j

            if !isnothing(max_product) && product >= max_product
                continue
            end

            if product < max_palindrome
                break
            end

            if is_palindrome(product) && product > max_palindrome
                max_palindrome = product
                best_i, best_j = i, j
            end
        end
    end

    return (palindrome=max_palindrome, factors=(best_i, best_j))
end
```

So we search through all products $ij$ in descending order to find the largest palindrome.
The search is sped up in a few ways. First, we iterate from largest to smallest values since
we're search for a maximum. This lets us terminate early if $ij$ can no longer exceed the
current maximum palindrome found so far. We added the option to specify a `max_product` to
solve the [HackerRank version](https://www.hackerrank.com/contests/projecteuler/challenges/euler004/problem)
of this problem.

Benchmarking the 3-digit case we find the solution `largest_palindrome_product(100, 999)` in @benchmark[problem-0004:3_digits].

For the 6-digit case we call `largest_palindrome_product(100000, 999999)` to find a maximum palindrome of $999,000,000,999 = 999,001 \times 999,999$ in @benchmark[problem-0004:6_digits].

We can also do the 9-digit case and call `largest_palindrome_product(100000000, 999999999)` to find $999,900,665,566,009,999 = 999,920,317 \times 999,980,347$ in @benchmark[problem-0004:9_digits] which is still under a minute.

Beyond that, for the 12-digit case we'll have to use 128-bit integers as the product of two 12-digit numbers
will easily overflow if we keep using 64-bit integers.
