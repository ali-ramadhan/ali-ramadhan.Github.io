---
layout: "blog-post"
title: "Problem 1: Multiples of 3 or 5"
date: 2024-09-09
---

The sum of the first $n$ integers is

```math
\sum_{k=1}^n k = \frac{n(n+1)}{2}
```

We can use this to derive a formula for the sum of the first $m$ integers below $L$,
which we'll denote $S(m, L)$. There are $\ell = \lfloor \frac{L-1}{m} \rfloor$ multiples
of $m$ below $L$. So

```math
S(m, L) = m + 2m + \cdots + \ell m = m \sum_{k=1}^\ell k = m \frac{\ell (\ell + 1)}{2}
```

Now we want to sum the multiples of two integers $a$ and $b$ below $L$. We do not want
to overcount, e.g. if we add up the multiples of 3 and 5, we need to make sure to only
count the multiples of $\operatorname{lcm}(3, 5) = 15$ once. This is an application of
the inclusion-exclusion principle:

```math
|A \cup B | = |A| + |B| - |A \cap B|
```

So the sum of the multiples of $a$ and $b$ below $L$ is

```math
S(a, L) + S(b, L) - S(\operatorname{lcm}(a, b), L)
```

We can implemen this as

```julia
function sum_arithmetic_series(n, limit)
    if n >= limit
        return 0
    end
    k = div(limit - 1, n)  # Number of multiples of n below limit
    return n * k * (k + 1) ÷ 2
end
```

and benchmarking this solution I get a median time of @benchmark[problem-001:solution1].
