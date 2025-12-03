---
layout: "project-euler-post"
bonus_problem: true
bonus_problem_number: 1
problem_name: "-1"
date: 2024-11-27
---

> If we list all the natural numbers below $10$ that are multiples of $3$ or $5$, we get $3, 5, 6$ and $9$. The sum of these multiples is $23$.
>
> Find the sum of all the multiples of $3$ or $5$ below infinity.

We won't need to write any code to solve this bonus problem. This is a twist on [Problem 1](/blog/project-euler/problem-0001/) where we used a formula for the sum of multiples of $a$ or $b$ below $L$ using the inclusion-exclusion principle:

```math
S([a, b], L) = s(a, L) + s(b, L) - s(\operatorname{lcm}(a, b), L)
```

but now $L = \infty$ so how can we compute $s$?

The sum $1 + 2 + 3 + 4 + \cdots$ obviously diverges. However, using [Ramanujan summation](https://en.wikipedia.org/wiki/Ramanujan_summation) or [zeta function regularization](https://en.wikipedia.org/wiki/Zeta_function_regularization), we can assign it a finite value.

The Riemann zeta function is defined for $\operatorname{Re}(z) > 1$ as

```math
\zeta(z) = \sum_{n=1}^\infty \frac{1}{n^z}
```

and can be analytically continued to the entire complex plane (except for a pole at $z = 1$). Evaluating at $z = -1$ gives

```math
\zeta(-1) = \sum_{n=1}^\infty \frac{1}{n^{-1}} = \sum_{n=1}^\infty n = 1 + 2 + 3 + 4 + \cdots = -\frac{1}{12}
```

You can think of this result as what happens when you "extrapolate" the value of $\zeta(z)$ to negative values of $z$.

Using this we can now compute the sum of all multiples of $3$ or $5$ below infinity:

```math
\begin{align}
S([3, 5], \infty) &= s(3, \infty) + s(5, \infty) - s(15, \infty) \\
                  &= \sum_{n=1}^\infty 3n + \sum_{n=1}^\infty 5n - \sum_{n=1}^\infty 15n \\
                  &= (3 + 5 - 15) \sum_{n=1}^\infty n \\
                  &= -7 \zeta(-1) \\
                  &= \frac{7}{12}
\end{align}
```

Numberphile has a [pretty good YouTube video](https://www.youtube.com/watch?v=w-I6XTVZXww) on how $\zeta(-1) = -1/12$. Also, there's a pretty good 2015 film about Ramanujan, [The Man Who Knew Infinity](https://en.wikipedia.org/wiki/The_Man_Who_Knew_Infinity), based on a book of the same name.
