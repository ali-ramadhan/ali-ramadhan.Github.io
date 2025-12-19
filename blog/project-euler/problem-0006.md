---
layout: "project-euler-post"
problem_number: 6
problem_name: "Sum Square Difference"
date: 2025-10-07
---

> The sum of the squares of the first ten natural numbers is,
>
> $$1^2 + 2^2 + ... + 10^2 = 385.$$
>
> The square of the sum of the first ten natural numbers is,
>
> $$(1 + 2 + ... + 10)^2 = 55^2 = 3025.$$
>
> Hence the difference between the sum of the squares of the first ten natural numbers and the square of the sum is $3025 - 385 = 2640$.
>
> Find the difference between the sum of the squares of the first one hundred natural numbers and the square of the sum.

Not sure if there's much to say on this problem besides that using two special cases of [Faulhaber's formula](https://en.wikipedia.org/wiki/Faulhaber%27s_formula) for powers of 1 and 2 we can write

```math
\sum_{k=1}^n k = \frac{n(n+1)}{2}
```

and

```math
\sum_{k=1}^n k^2 = \frac{n(n+1)(2n+1)}{6}
```

So we can compute the answer directly using

```math
\begin{align}
  \operatorname{SSD}(n) &= \left( \sum_{k=1}^n k \right)^2 - \sum_{k=1}^n k^2 \\
                        &= \left( \frac{n(n+1)}{2} \right)^2 - \frac{n(n+1)(2n+1)}{6} \\
                        &= \frac{n(n+1)(n-1)(3n+2)}{12}
\end{align}
```

With a simple implementation

```julia
function sum_square_difference(n)
    return n * (n + 1) * (n - 1) * (3n + 2) ÷ 12
end
```

we call `sum_square_difference(100)` to compute the solution which runs in @benchmark[problem-0006:n_100].
