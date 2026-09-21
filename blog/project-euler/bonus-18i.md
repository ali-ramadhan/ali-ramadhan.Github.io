---
layout: "project-euler-post"
bonus_problem: true
bonus_problem_number: 4
problem_name: "18i"
date: 2025-12-13
difficulty_estimate: 74
benchmark_file: "bonus-18i"
benchmark_key: "solution"
---

> Let $R(p)$ be the remainder when the _product_ $\prod_{x=0}^{p-1}(x^3-3x+4)$ is divided by $p$. For example, $R(11)=0$ and $R(29)=13$.
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

Now it's useful that $p$ is prime because we are working in $\mathbb{F}_p$, the [finite field](https://en.wikipedia.org/wiki/Finite_field) with $p$ elements which is equivalent to the integers modulo $p$ with modular addition and multiplication. We have a field (rather than just a [ring](<https://en.wikipedia.org/wiki/Ring_(mathematics)>)) because $p$ being prime guarantees every non-zero element has a multiplicative inverse. This gives us a nice algebraic structure where polynomials behave predictably: a degree-$n$ polynomial has at most $n$ roots.

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

The key property is that its characteristic polynomial $\det(\lambda I - M) = \lambda^3 - 3\lambda + 4$ recovers the original polynomial, so its eigenvalues are exactly $\alpha_1$, $\alpha_2$, and $\alpha_3$.

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
C_{i,j} = \left( \sum_{k=1}^3 A_{i,k} B_{k,j} \right) \pmod{p}
```

which we can do by creating a mutable static array `MMatrix` then filling it before converting it to an `SMatrix`.

@code[bonus-18i:using StaticArrays,mat_mul_mod]

Now we can use `mat_mul_mod` to write a function that computes $M^p \pmod{p}$ efficiently using [binary exponentiation](https://en.wikipedia.org/wiki/Exponentiation_by_squaring). Computing $M^p$ naively would require $p - 1$ multiplications which is too slow when $p \approx 10^9$. Binary exponentiation reduces this to $O(\log p)$ multiplications by exploiting the binary representation of the exponent. For example, $M^{13} = M^{1101_2} = M^8 \cdot M^4 \cdot M^1$ since $13 = 8 + 4 + 1$. The algorithm loops through the bits of the exponent: it squares the base at each step (giving $M^1, M^2, M^4, M^8, \ldots$) and multiplies into the result whenever the current bit is 1.

@code[bonus-18i:mat_pow_mod]

To compute the determinant of $Y = M^p - M$ we use [cofactor expansion](https://en.wikipedia.org/wiki/Laplace_expansion) along the first row, being careful to avoid integer overflow.

@code[bonus-18i:det3_mod]

Now we're ready to compute $R(p) \pmod{p}$. The polynomial has a root in $\mathbb{F}_2$ ($k = 1$) and in $\mathbb{F}_3$ ($k = 2$) so $R(2) = R(3) = 0$, and the derivation above needed $p$ to be odd anyway, so we return early for $p \le 3$.

@code[bonus-18i:R_mod_p]

Now we just need to sum over all $p$. Since each prime can be processed independently, this is an embarrassingly parallel problem and we can parallelize this computation across multiple threads. The range is divided into chunks, with each thread processing its own chunk and computing a local sum. `MillerRabin(high)` is the deterministic Miller-Rabin test from the package's prime utilities, constructed once with the largest value we'll test so that the witness set is precomputed rather than looked up for every $n$.

@code[bonus-18i:using ProjectEulerSolutions.Utils.Primes,sum_R_mod_p,_sum_R_mod_p_inner]

Running `sum_R_mod_p(1_000_000_000, 1_100_000_000)` returns the answer in @benchmark[bonus-18i:solution]!

## $18i$

The problem name comes from the [discriminant](https://en.wikipedia.org/wiki/Discriminant) of the polynomial. For a depressed cubic $x^3 + ax + b$, the discriminant is $\Delta = -4a^3 - 27b^2$. For $x^3 - 3x + 4$ we have $\Delta = -324$.

The [resultant](https://en.wikipedia.org/wiki/Resultant) of two polynomials measures whether they share a common root. It turns out that evaluating a polynomial over all of $\mathbb{F}_p$ gives a resultant since the roots of $x^p - x$ are exactly $\mathbb{F}_p$ as discussed earlier. This leads to the identity, valid for primes where $f$ has no root in $\mathbb{F}_p$ (when $f$ has a root, $R(p)$ just vanishes):

```math
R(p)^2 \equiv \Delta \pmod{p}.
```

For such primes $R(p) \neq 0$, and this tells us

```math
R(p) = \pm\sqrt{\Delta} = \pm\sqrt{-324} = \pm 18i
```

So for any prime $p$ where $R(p) \neq 0$, the answer is a modular square root of $-324$ in $\mathbb{F}_p$. The companion matrix approach we took actually automatically computes the correct sign via the determinant though.
