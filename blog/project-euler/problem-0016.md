---
layout: "project-euler-post"
problem_number: 16
problem_name: "Power Digit Sum"
date: 2025-12-07
---

> $2^{15} = 32768$ and the sum of its digits is $3 + 2 + 7 + 6 + 8 = 26$.
>
> What is the sum of the digits of the number $2^{1000}$?

This is pretty easy. Just compute $2^{1000}$ using `BigInt`, convert the result to a string, and sum each digit.

```julia
function sum_of_digits(n)
    sum = 0
    for digit in string(n)
        sum += parse(Int, digit)
    end
    return sum
end

function power_digit_sum(base, exponent)
    big_num = big(base)^big(exponent)
    return sum_of_digits(big_num)
end
```

It computes the solution in @benchmark[problem-0016:power_digit_sum_2_1000].

Going a bit further, we find that the sum of the digits of $2^{10^6}$ is 1351546 in @benchmark[problem-0016:power_digit_sum_2_1M].
