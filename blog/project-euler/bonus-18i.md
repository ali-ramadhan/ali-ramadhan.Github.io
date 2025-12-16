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

## Deriving an efficient way to compute $R(p)$

Ok so we need to compute the value of

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

Now it's useful that $p$ is prime because we are working in $\mathbb{F}_p$, the [finite field](https://en.wikipedia.org/wiki/Finite_field) with $p$ elements which is equivalent to the integers modulo $p$ with modular addition and multiplication. We have a field (rather than just a [ring](https://en.wikipedia.org/wiki/Ring_(mathematics))) because $p$ being prime guarantees every non-zero element has a multiplicative inverse. This gives us a nice algebraic structure where polynomials behave predictably: a degree-$n$ polynomial has at most $n$ roots.

By [Fermat's Little Theorem](https://en.wikipedia.org/wiki/Fermat%27s_little_theorem) we know that $k^p \equiv k \pmod{p}$, which means every element of $\mathbb{F}_p$ is a root of $x^p - x$. Since $x^p - x$ has degree $p$ and can have at most $p$ roots, these must be all the roots, giving us the factorization

```math
x^p - x = \prod_{k=0}^{p-1} (x - k)
```

Substituting $x = \alpha_i$ into this factorization gives $\alpha_i^p - \alpha_i = \prod_{k=0}^{p-1} (\alpha_i - k)$, which lets us rewrite the three product terms in $R(p)$ as

```math
\prod_{k=0}^{p-1} (k - \alpha_i) = (-1)^p \prod_{k=0}^{p-1} (\alpha_i - k) = -(\alpha_i^p - \alpha_i)
```

where $(-1)^p = -1$ since $p$ is an odd prime. And so

```math
\begin{align}
R(p) &= \left[ -(\alpha_1^p - \alpha_1) \right] \left[ -(\alpha_2^p - \alpha_2) \right] \left[ -(\alpha_3^p - \alpha_3) \right] \pmod{p} \\
     &= -(\alpha_1^p - \alpha_1)(\alpha_2^p - \alpha_2)(\alpha_3^p - \alpha_3) \pmod{p}
\end{align}
```

So this is a much easier way to compute $R(p)$ but we don't know $\alpha_i$ and they're not even going to be integers or in $\mathbb{F}_p$.

Here's where we can use some linear algebra! The [companion matrix](https://en.wikipedia.org/wiki/Companion_matrix) for a monic polynomial $x^n + a_{n-1}x^{n-1} + \cdots + a_1 x + a_0$ is constructed by placing 1s on the subdiagonal and the negated coefficients $-a_0, -a_1, \ldots, -a_{n-1}$ in the last column. For $x^3 - 3x + 4$ we have $a_0 = 4$, $a_1 = -3$, $a_2 = 0$ so this gives

```math
M =
\begin{pmatrix}
0 & 0 & -4 \\
1 & 0 & 3 \\
0 & 1 & 0
\end{pmatrix}
```

The key property is that its characteristic polynomial $\det(M - \lambda I) = \lambda^3 - 3\lambda + 4$ recovers the original polynomial, so its eigenvalues are exactly $\alpha_1$, $\alpha_2$, and $\alpha_3$.

We can now invoke the [spectral mapping theorem](https://en.wikipedia.org/wiki/Spectral_mapping_theorem), which states that if a matrix $M$ has eigenvalue $\lambda$, then $f(M)$ has eigenvalue $f(\lambda)$ for any polynomial $f$. It's called "spectral" because the spectrum of a matrix is the set of its eigenvalues. Applying this with $f(x) = x^p - x$, we get that $Y = M^p - M$ has eigenvalues $\lambda_i^\prime = \alpha_i^p - \alpha_i$. Since the [determinant of a matrix equals the product of its eigenvalues](https://en.wikipedia.org/wiki/Eigenvalues_and_eigenvectors#Eigenvalues_and_the_characteristic_polynomial), we have

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

Now we can use `mat_mul_mod` to write a function that computes $M^p \pmod{p}$ efficiently using [binary exponentiation](https://en.wikipedia.org/wiki/Exponentiation_by_squaring). Computing $M^p$ naively would require $p - 1$ multiplications which is too slow when $p \approx 10^9$. Binary exponentiation reduces this to $O(\log p)$ multiplications by exploiting the binary representation of the exponent. For example, $M^{13} = M^{1101_2} = M^8 \cdot M^4 \cdot M^1$ since $13 = 8 + 4 + 1$. The algorithm loops through the bits of the exponent: it squares the base at each step (giving $M^1, M^2, M^4, M^8, \ldots$) and multiplies into the result whenever the current bit is 1.

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

To compute the determinant of $Y = M^p - M$ we use [cofactor expansion](https://en.wikipedia.org/wiki/Laplace_expansion) along the first row, being careful to avoid integer overflow.

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
    # For p = 2, the product includes k = 1 where k³ - 3k + 4 = 2 ≡ 0 (mod 2), so R(2) = 0.
    # For p = 3, the product includes k = 2 where k³ - 3k + 4 = 6 ≡ 0 (mod 3), so R(3) = 0.
    # These are the only primes where k³ - 3k + 4 has a root in F_p.
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

Running `sum_R_mod_p(1_000_000_000, 1_100_000_000)` returns the answer in @benchmark[bonus-18i:solution]!

## $18i$

The problem name comes from the [discriminant](https://en.wikipedia.org/wiki/Discriminant) of the polynomial. For a depressed cubic $x^3 + ax + b$, the discriminant is $\Delta = -4a^3 - 27b^2$. For $x^3 - 3x + 4$ we have $\Delta = -324$.

The [resultant](https://en.wikipedia.org/wiki/Resultant) of two polynomials measures whether they share a common root. It turns out that evaluating a polynomial over all of $\mathbb{F}_p$ gives a resultant since the roots of $x^p - x$ are exactly $\mathbb{F}_p$ as discussed earlier. This leads to the identity

```math
R(p)^2 \equiv \Delta \pmod{p}.
```

When $f$ has no roots in $\mathbb{F}_p$ (so $R(p) \neq 0$), this tells us

```math
R(p) = \pm\sqrt{\Delta} = \pm\sqrt{-324} = \pm 18i
```

So for any prime $p$ where $R(p) \neq 0$, the answer is a modular square root of $-324$ in $\mathbb{F}_p$. The companion matrix approach we took actually automatically computes the correct sign via the determinant though.
