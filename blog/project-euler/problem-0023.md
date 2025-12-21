---
layout: "project-euler-post"
problem_number: 23
problem_name: "Non-Abundant Sums"
date: 2025-12-16
difficulty: 5
benchmark_file: "problem-0023"
benchmark_key: "solution"
---

> A perfect number is a number for which the sum of its proper divisors is exactly equal to the number. For example, the sum of the proper divisors of $28$ would be $1 + 2 + 4 + 7 + 14 = 28$, which means that $28$ is a perfect number.
>
> A number $n$ is called deficient if the sum of its proper divisors is less than $n$ and it is called abundant if this sum exceeds $n$.
>
> As $12$ is the smallest abundant number, $1 + 2 + 3 + 4 + 6 = 16$, the smallest number that can be written as the sum of two abundant numbers is $24$. By mathematical analysis, it can be shown that all integers greater than $28123$ can be written as the sum of two abundant numbers. However, this upper limit cannot be reduced any further by analysis even though it is known that the greatest number that cannot be expressed as the sum of two abundant numbers is less than this limit.
>
> Find the sum of all the positive integers which cannot be written as the sum of two abundant numbers.

Building on [Problem 21](/blog/project-euler/problem-0021/) we can reuse `sum_proper_divisors_sieve` to find all abundant numbers. A number is abundant if the sum of its proper divisors exceeds the number itself.

While the problem states that all integers greater than 28123 can be written as the sum of two abundant numbers, [Wolfram MathWorld](https://mathworld.wolfram.com/AbundantNumber.html) gives us a tighter bound of 20161.

```julia
function find_abundant_numbers(limit)
    sod = sum_proper_divisors_sieve(limit)
    return [n for n in 1:limit if sod[n] > n]
end
```

Now rather than checking each number to see if it can be expressed as a sum of two abundant numbers, we generate all possible sums of two abundant numbers use a boolean array to mark which numbers we arrive at.

```julia
function sum_non_abundant_sums(limit)
    abundant_nums = find_abundant_numbers(limit)

    can_be_sum = falses(limit)

    for i in eachindex(abundant_nums)
        for j in i:lastindex(abundant_nums)
            sum = abundant_nums[i] + abundant_nums[j]
            if sum <= limit
                can_be_sum[sum] = true
            else
                break
            end
        end
    end

    result = 0
    for i in 1:limit
        if !can_be_sum[i]
            result += i
        end
    end

    return result
end
```

Note that we iterate `j` from `i` rather than from 1 because addition is commutative and if we've already marked $a + b$, we don't need to check $b + a$. We also break early when the sum exceeds the limit since the abundant numbers are in ascending order.

`sum_non_abundant_sums(20161)` returns the answer in @benchmark[problem-0023:solution].
