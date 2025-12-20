---
layout: "project-euler-post"
problem_number: 20
problem_name: "Factorial Digit Sum"
date: 2025-12-10
difficulty: 5
benchmark_file: "problem-0020"
benchmark_key: "factorial_100"
---

> $n!$ means $n \times (n - 1) \times \cdots \times 3 \times 2 \times 1$.
>
> For example, $10! = 10 \times 9 \times \cdots \times 3 \times 2 \times 1 = 3628800$,
> and the sum of the digits in the number $10!$ is $3 + 6 + 2 + 8 + 8 + 0 + 0 = 27$.
>
> Find the sum of the digits in the number $100!$.

This is pretty similar to [Problem 16](/blog/project-euler/problem-0016/). We'll just use `BigInt` to compute large factorials, convert them to strings, and sum up the digits.

```julia
function sum_of_factorial_digits(n)
    fact = factorial(big(n))
    digits_sum = sum(parse(Int, c) for c in string(fact))
    return digits_sum
end
```

`sum_of_factorial_digits(100)` computes the sum of the digits of $100!$ in @benchmark[problem-0020:factorial_100].

`sum_of_factorial_digits(1000000)` computes the sum of the digits of $10^6!$ to be 23903442 in @benchmark[problem-0020:factorial_1M].
