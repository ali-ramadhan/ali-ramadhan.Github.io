---
layout: "project-euler-post"
problem_number: 6
problem_name: "Sum Square Difference"
date: 2024-10-07
---

> The sum of the squares of the first ten natural numbers is,
> $$1^2 + 2^2 + ... + 10^2 = 385.$$
> The square of the sum of the first ten natural numbers is,
> $$(1 + 2 + ... + 10)^2 = 55^2 = 3025.$$
> Hence the difference between the sum of the squares of the first ten natural numbers and the square of the sum is $3025 - 385 = 2640$.
> Find the difference between the sum of the squares of the first one hundred natural numbers and the square of the sum.

Not sure if there's much to say on this problem besides that

```math
\sum_{k=1}^n k = \frac{n(n+1)}{2}
```

and

```math
\sum_{k=1}^n k^2 = \frac{n(n+1)(2n+1)}{6}
```

so we can compute the answer directly using

```math
\operatorname{SSD}(n) = \sum_{k=1}^n k^2 - \left( \sum_{k=1}^n k \right)^2 = \frac{n(n+1)(2n+1)}{6} - \left( \frac{n(n+1)}{2} \right)^2
```

```julia
function square_of_sum(n)
    sum = n * (n + 1) ÷ 2
    return sum^2
end

function sum_of_squares(n)
    return n * (n + 1) * (2n + 1) ÷ 6
end

function sum_square_difference(n)
    return square_of_sum(n) - sum_of_squares(n)
end
```

`sum_square_difference(100)` runs in @benchmark[problem-0006:n_100]