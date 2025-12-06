---
layout: "project-euler-post"
problem_number: 9
problem_name: "Special Pythagorean Triplet"
date: 2025-11-30
---

> A Pythagorean triplet is a set of three natural numbers, $a \lt b \lt c$, for which, $$a^2 + b^2 = c^2.$$
> For example, $3^2 + 4^2 = 9 + 16 = 25 = 5^2$.
> There exists exactly one Pythagorean triplet for which $a + b + c = 1000$.
> Find the product $abc$.

We'll solve the more general problem where $a + b + c = n$.

We're looking for three values but we have two constraints which we can use to avoid having to search for $b$ and $c$. When searching we can compute $c$ by solving $a + b + c = n$ for $c$ to get $c = n - a - b$.

We can substitute the equation for $c$ into $a^2 + b^2 = c^2$ to get $a^2 + b^2 = (n - a - b)^2$. Solving it for $b$ we get

```math
b = \frac{n(n - 2a)}{2(n - a)}
```

So now we can just iterate through possible values for $a$ and compute $b$ and $c$ directly, converting a search space problem potentially consisting of three nested for loops with $\mathcal{O}(n^3)$ time complexity into a single for loop taking $\mathcal{O}(n)$ time.

We can use the constraints $a < b < c$ and $a + b + c = n$ to place an upper limit on $a$: it cannot be larger than $a_\text{max} = \lfloor n/3 \rfloor$ otherwise $a + b + c$ would exceed $n$.

So we just need to iterate through values of $a$ until $a_\text{max}$. For each value of $a$ we can directly compute values for $b$ and $c$ and see if they satisfy all the contraints. If they do, we have found a Pythagorean triplet!

```julia
function find_pythagorean_triplets(n)
    triplets = Tuple{Int,Int,Int}[]

    for a in 1:(n÷3)
        numerator = n * (n - 2a)
        denominator = 2 * (n - a)

        # Check if b is an integer
        if numerator % denominator == 0
            b = numerator ÷ denominator

            if b > 0 && b > a
                c = n - a - b

                if a < b < c && a^2 + b^2 == c^2
                    push!(triplets, (a, b, c))
                end
            end
        end
    end

    return triplets
end
```

This code finds the special Pythagorean triplet for $n = 10^3$ in @benchmark[problem-0009:n_1000] after which we can easily compute $abc$ to solve the problem.

Taking it a bit further, we find two Pythagorean triplets for $n = 10^6$ in @benchmark[problem-0009:n_1000000]: $(200000, 375000, 425000)$ and $(218750, 360000, 421250)$.

And even further, we find seven Pythagorean triplets for $n = 1234567890$ in @benchmark[problem-0009:n_1234567890]: $(63080361, 584045440, 587442089)$, $(63627480, 583741485, 587198925)$, $(123456789, 548696840, 562414261)$, $(149857215, 532003644, 552707031)$, $(180721521, 511427440, 542418929)$, $(205761315, 493827156, 534979419)$, and $(258784215, 453576204, 522207471)$.
