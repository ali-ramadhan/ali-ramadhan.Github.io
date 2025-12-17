---
layout: "project-euler-post"
problem_number: 25
problem_name: "1000-digit Fibonacci Number"
date: 2025-12-17
---

> The Fibonacci sequence is defined by the recurrence relation:
>
> $F_n = F_{n-1} + F_{n-2}$, where $F_1 = 1$ and $F_2 = 1$.
>
> Hence the first 12 terms will be:
>
> ```math
> \begin{align}
>   F_1 &= 1 \\
>   F_2 &= 1 \\
>   F_3 &= 2 \\
>   F_4 &= 3 \\
>   F_5 &= 5 \\
>   F_6 &= 8 \\
>   F_7 &= 13 \\
>   F_8 &= 21 \\
>   F_9 &= 34 \\
>   F_{10} &= 55 \\
>   F_{11} &= 89 \\
>   F_{12} &= 144
> \end{align}
> ```
>
> The 12th term, $F_{12}$, is the first term to contain three digits.
>
> What is the index of the first term in the Fibonacci sequence to contain 1000 digits?

This is another Fibonacci problem, building on [Problem 2](/blog/project-euler/problem-0002/). The straightforward approach is to generate Fibonacci numbers until we find one with 1000 digits:

```julia
function first_fibonacci_with_n_digits(n)
    a, b = BigInt(1), BigInt(1)
    i = 2

    while ndigits(b) < n
        a, b = b, a + b
        i += 1
    end

    return i
end
```

We use `BigInt` since Fibonacci numbers grow exponentially and will overflow standard integers long before reaching 1000 digits.

But there's a closed-form solution using [Binet's formula](https://en.wikipedia.org/wiki/Fibonacci_sequence#Binet's_formula). The $n$th Fibonacci number can be expressed as

```math
F_n = \frac{\varphi^n - \psi^n}{\sqrt{5}}
```

where $\varphi = \frac{1 + \sqrt{5}}{2}$ is the golden ratio and $\psi = \frac{1 - \sqrt{5}}{2}$. Since $|\psi| < 1$, the $\psi^n$ terms becomes small and negligible very quickly. So

```math
F_n \approx \frac{\varphi^n}{\sqrt{5}}
```

For $F_n$ to have $d$ digits, we need $F_n \geq 10^{d-1}$:

```math
\frac{\varphi^n}{\sqrt{5}} \geq 10^{d-1}
```

which we can solve for $n$ to obtain

```math
n \geq \frac{(d-1) \log 10 + \frac{1}{2} \log 5}{\log\varphi}
```

This gives us a direct formula:

```julia
function first_fibonacci_with_n_digits_formula(n)
    φ = (1 + √5) / 2
    return ceil(Int, ((n - 1) * log(10) + 0.5 * log(5)) / log(φ))
end
```

Both approaches give the same answer, but the using the formula is going to take like a few CPU cycles while the iterative approach will keep creating larger and larger integers. The iterative approach takes @benchmark[problem-0025:iterative_1000] while the formula computes the answer in @benchmark[problem-0025:formula_1000].

For finding the first Fibonacci number with 10,000 digits, it takes @benchmark[problem-0025:iterative_10000] for the iterative approach versus @benchmark[problem-0025:formula_10000] for the formula. Turns out it is $F_{47847}$.
