---
layout: "project-euler-post"
bonus_problem: true
bonus_problem_number: 4
problem_name: "18i"
date: 2025-12-13
---

> Let $R(p)$ be the remainder when the *product* $\prod_{x=0}^{p-1}(x^3-3x+4)$ is divided by $p$. For example, $R(11)=0$ and $R(29)=13$.
>
> Find the sum of $R(p)$ over all primes $p$ between $1\,000\,000\,000$ and $1\,100\,000\,000$.

Ok so we need to compute the value of

## Deriving an efficient way to compute $R(p)$

```math
R(p) = \left[ \prod_{k=0}^{p-1} (k^3 - 3k + 4) \right] \pmod{p}
```

for many values of large $p$. That's a lot of terms in each product so we'll need to simplify $R(p)$ to something much easier to compute.

Since $k^3 - 3k + 4$ is a cubic polynomial it has three roots and we can write it as $(k - \alpha_1) (k - \alpha_2) (k - \alpha_3)$. Then

```math
\begin{align}
R(p) &= \left[ \prod_{k=0}^{p-1} (k - \alpha_1) (k - \alpha_2) (k - \alpha_3) \right] \pmod{p} \\
     &= \left[ \prod_{k=0}^{p-1} (k - \alpha_1) \right] \left[ \prod_{k=0}^{p-1} (k - \alpha_2) \right] \left[ \prod_{k=0}^{p-1} (k - \alpha_3) \right] \pmod{p}
\end{align}
```

Now it's useful that $p$ is prime because we are working in $\mathbb{F}_p$. Then by [Fermat's Little Theorem](https://en.wikipedia.org/wiki/Fermat%27s_little_theorem) we know that $k^p \equiv k \pmod{p}$. Thus the roots of the polynomial $x^p - x$ are $0, 1, 2, \cdots, p-1$ and we can write

```math
x^p - x = \prod_{k=0}^{p-1} (x - k)
```

which lets us rewrite the three product terms in $R(p)$ as

```math
\prod_{k=0}^{p-1} (k - \alpha_i) = (-1)^p \prod_{k=0}^{p-1} (\alpha_i - k) = -(\alpha_i^p - \alpha_i)
```

and

```math
\begin{align}
R(p) &= \left[ -(\alpha_1^p - \alpha_1) \right] \left[ -(\alpha_2^p - \alpha_2) \right] \left[ -(\alpha_3^p - \alpha_3) \right] \pmod{p} \\
     &= -(\alpha_1^p - \alpha_1)(\alpha_2^p - \alpha_2)(\alpha_3^p - \alpha_3) \pmod{p}
\end{align}
```

So this is a much easier way to compute $R(p)$ but we don't know $\alpha_i$ and they're not even going to be integers or in $\mathbb{F}_p$.

Here's where we can use some linear algebra! The _companion matrix_ for the polynomial $x^3 - 3x + 4$ is

```math
M =
\begin{pmatrix}
0 & 0 & -4 \\
1 & 0 & 3 \\
0 & 1 & 0
\end{pmatrix}
```

because its characteristic polynomial from $\det(M - \lambda I) = 0$ is $\lambda^3 - 3\lambda + 4 = 0$ so its eigenvalues are $\alpha_1$, $\alpha_2$, and $\alpha_3$.

We can now invoke the spectral mapping theorem which states that if a matrix $M$ has eigenvalue $\lambda$ then the matrix polynomial $M^p - M$ has eigenvalue $\lambda^p - \lambda$. Let $Y = M^p - M$ then $\det(Y - \lambda^\prime I) = 0$ gives us that the eigenvalues of $Y$ are $\lambda_i^\prime = \alpha_i^p - \alpha_i$. Then we can write

```math
\det Y = \lambda_1^\prime \lambda_2^\prime \lambda_3^\prime = (\alpha_1^p - \alpha_1) (\alpha_2^p - \alpha_2) (\alpha_3^p - \alpha_3)
```

which is just the negative of $R(p)$, meaning we can compute $R(p)$ by just computing the determinant of $Y$:

```math
R(p) = - \det Y \pmod{p}
```

So now we have a strategy! We can efficiently compute $Y = M^p - M$ using binary exponentiation and compute the determinant modulo $p$. This way we can compute $R(p)$ for all the primes between $10^9$ and $1.1 \times 10^9$ and sum the results. Since all $p$ are pretty large it will be more efficient to check for primality using something like the Miller-Rabin test rather than trial division.

## Implementation

Since the matrices are $3 \times 3$ and small, we will be using static arrays through the [StaticArrays.jl](https://github.com/JuliaArrays/StaticArrays.jl) package so we can avoid memory allocations associated with matrix operations.

First we will want a function to do matrix multiplication modulo $p$, $C = A \times B \pmod{p}$. We can compute $C$ element-wise

```math
C_{i,j} ​= \left( \sum_{k=1}^3 A_{i,k} B_{k,j} \right) \pmod{p}
```

which we can do by creating a mutable static array `MMatrix` then filling it before converting it to an `SMatrix`.

```julia
using StaticArrays

@inline function mat_mul_mod(A::SMatrix{3,3,Int}, B::SMatrix{3,3,Int}, p::Int)
    C = MMatrix{3,3,Int}(undef)
    @inbounds for j in 1:3
        for i in 1:3
            s = 0
            for k in 1:3
                s += A[i,k] * B[k,j]
            end
            C[i,j] = s % p
        end
    end
    return SMatrix(C)
end
```

Now we can use `mat_mul_mod` to write a function that computes $M^p \pmod{p}$ efficiently using [binary exponentiation](https://en.wikipedia.org/wiki/Exponentiation_by_squaring)

```julia
function mat_pow_mod(A::SMatrix{3,3,Int}, exp::Int, p::Int)
    result = @SMatrix [1 0 0; 0 1 0; 0 0 1] # Identity matrix
    base = A

    while exp > 0
        if (exp & 1) == 1
            result = mat_mul_mod(result, base, p)
        end
        exp >>= 1
        if exp > 0
            base = mat_mul_mod(base, base, p)
        end
    end
    return result
end
```

To compute the determinant of $Y = M^p - M$ we can just use the [Rule of Sarrus](https://en.wikipedia.org/wiki/Rule_of_Sarrus) for computing the determinant of a $3 \times 3$ matrix being careful to avoid integer overflow.

```julia
@inline function det3_mod(M::SMatrix{3,3,Int}, p::Int)
    @inbounds begin
        a, b, c = M[1,1], M[1,2], M[1,3]
        d, e, f = M[2,1], M[2,2], M[2,3]
        g, h, i = M[3,1], M[3,2], M[3,3]
    end

    term1 = (a * (mod(e*i - f*h, p))) % p
    term2 = (b * (mod(d*i - f*g, p))) % p
    term3 = (c * (mod(d*h - e*g, p))) % p

    return mod(term1 - term2 + term3, p)
end
```

Now we're ready to compute $R(p) \pmod{p}$.

```julia
function R_mod_p(p)
    if p <= 3
        return 0
    end

    M = @SMatrix [0  0 -4;
                  1  0  3;
                  0  1  0]

    Mp = mat_pow_mod(M, p, p)

    # Compute Y = M^p - M by applying mod(a - b, p) to every pair of elements.
    Y = map((a, b) -> mod(a - b, p), Mp, M)

    D = det3_mod(Y, p)
    return mod(-D, p)
end
```

Now we just need to sum over all $p$

```julia
function sum_R_mod_p(low, high)
    total_sum = 0

    for n in low:high
        if is_prime(n, MillerRabin())
            total_sum += R_mod_p(n)
        end
    end

    return total_sum
end
```

Running `sum_R_mod_p(1_000_000_000, 1_100_000_000)` returns the answer in @benchmark[bonus-18i:solution] with no memory allocations!

I should revisit this problem to explain the significance of $18i$. And maybe there's room to make the solution more efficient if we can compute the elements of $M^p - M$ directly instead of using matrix exponentiation?
