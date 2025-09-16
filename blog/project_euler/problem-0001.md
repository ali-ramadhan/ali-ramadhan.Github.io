---
layout: "project-euler-post"
problem_number: 1
problem_name: "Multiples of 3 or 5"
date: 2024-09-09
---

Let's consider the problem of summing all multiples of $a$ or $b$ below $L$.

## Generator expression

The cleanest solution is to just sum over all integers below $L$ that divide $a$ or $b$
using a generator expression to avoid memory allocations if we used a list
comprehension:

```julia
function sum_multiples_two_generator(a, b, L)
    return sum(n for n in 1:L-1 if n % a == 0 || n % b == 0)
end
```

Benchmarking `sum_multiples_two_generator(3, 5, 1000)`, it runs in
@benchmark[problem-0001:two_generator].

## Using the inclusion-exclusion principle

We can do better because we know that the
[sum of the first $n$ integers](https://en.wikipedia.org/wiki/1_%2B_2_%2B_3_%2B_4_%2B_%E2%8B%AF)
is

```math
\sum_{k=1}^n k = \frac{n(n+1)}{2}
```

We can use this to derive a formula for the sum of the first $m$ integers below $L$,
which we'll denote $s(m, L)$. There are $\ell = \lfloor \frac{L-1}{m} \rfloor$ multiples
of $m$ below $L$. So

```math
s(m, L) = m + 2m + \cdots + \ell m = m \sum_{k=1}^\ell k = m \frac{\ell (\ell + 1)}{2}
```

Using this, $s(a, L) + s(b, L)$ would be the sum of all multiple of $a$ or $b$ below
$L$, but this double counts shared multiples, whose sum would be $s(\operatorname{lcm}(a, b), L)$.
So the actual sum of all multiples of $a$ or $b$ below $L$, which we'll denote $S([a, b], L)$ should be

```math
S([a, b], L) = s(a, L) + s(b, L) - s(\operatorname{lcm}(a, b), L)
```

This is an application of the [inclusion-exclusion principle](https://en.wikipedia.org/wiki/Inclusion%E2%80%93exclusion_principle)
for the case two finite sets, which says that

```math
|A \cup B | = |A| + |B| - |A \cap B|
```

where $A$ and $B$ are two finite sets and $|S|$ is the cardinality of the set $S$.

We can code this up as

```julia
function sum_multiples(m, L)
    if m >= L
        return 0
    end
    l = div(L - 1, m)
    return m * l * (l + 1) ÷ 2
end

function sum_multiples_two(a, b, limit)
    return sum_multiples(a, limit) +
           sum_multiples(b, limit) -
           sum_multiples(lcm(a, b), limit)
end
```

and benchmarking `sum_multiples_two(3, 5, 1000)` I get a median time of
@benchmark[problem-0001:two_ie] which is roughly 2000x faster. It might even be faster
but it's quite difficult to benchmark an operation that takes less than 1 ns as system
clocks don't have sub-nanosecond resolution.

## Three factors

The generator solution can easily be extended to deal with three factors:

```julia
function sum_multiples_three_generator(a, b, c, L)
    return sum(n for n in 1:L-1 if n % a == 0 || n % b == 0 || n % c == 0)
end
```

Let's sum the multiples of 3, 5, and 7 below $10^6$. Benchmarking
`sum_multiples_three_generator(3, 5, 7, 10^6)` we get
@benchmark[problem-0001:three_generator]. Taking ~1500x longer than the 2 factor case
with $L = 10^3$ makes sense since it's now checking 1000 times more numbers and 50% more
factors.

The inclusion-exclusion principle extends to any number of finite sets, although it does
get more complex. For three finite sets $A$, $B$, and $C$:

```math
|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|
```

So for three factors $a$, $b$, and $c$ we'll have to add all the individual sums,
subtract all pairwise interactions to avoid double counting, but then add back in the
triple intersection that was subtracted too many times:

```math
\begin{align}
S([a, b, c], L) &= s(a, L) + s(b, L) + s(c, L) \\
                &\quad - s(\operatorname{lcm}(a, b), L) - s(\operatorname{lcm}(a, c), L) - s(\operatorname{lcm}(b, c), L) \\
                &\quad + s(\operatorname{lcm}(a, b, c), L)
\end{align}
```

We can implement this as:

```julia
function sum_multiples_three_ie(a, b, c, L)
    return sum_multiples(a, L) +
           sum_multiples(b, L) +
           sum_multiples(c, L) -
           sum_multiples(lcm(a, b), L) -
           sum_multiples(lcm(a, c), L) -
           sum_multiples(lcm(b, c), L) +
           sum_multiples(lcm(a, b, c), L)
end
```

and if we benchmark `sum_multiples_three_ie(3, 5, 7, 10^6)` we get
@benchmark[problem-0001:three_ie] which again is sub-nanosecond.

## Complexity Analysis

Let $f$ be the number of factors we're considering.

The generator solutions take $\mathcal{O}(Lf)$ time as they iterate through every number
until $L$ and perform $f$ modulo operations per number. They use $\mathcal{O}(1)$ space
since generators don't allocate memory for intermediate results.

The inclusion-exclusion solutions achieve $\mathcal{O}(2^f)$ time complexity, as they
need to compute $2^f - 1$ non-empty subsets to apply the inclusion-exclusion principle.
But otherwise computing an LCM and using the sum formula takes constant time.
They also use $\mathcal{O}(1)$ space, storing only a few variables.

For more factors, I personally prefer the elegance of the generator expression but if
performance was critical there's probably a nice way to generate the terms of the
inclusion-exclusion principle. But then, in the case of many factors and smaller $L$ the
generator expression may end up being faster.
