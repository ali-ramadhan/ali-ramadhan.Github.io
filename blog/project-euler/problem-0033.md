---
layout: "project-euler-post"
problem_number: 33
problem_name: "Digit Cancelling Fractions"
date: 2026-04-30
difficulty: 2
benchmark_file: "problem-0033"
benchmark_key: "multiply_curious_fractions_N2_K1"
---

> The fraction $49/98$ is a curious fraction, as an inexperienced mathematician in attempting to simplify it may incorrectly believe that $49/98 = 4/8$, which is correct, is obtained by cancelling the $9$s.
>
> We shall consider fractions like, $30/50 = 3/5$, to be trivial examples.
>
> There are exactly four non-trivial examples of this type of fraction, less than one in value, and containing two digits in the numerator and denominator.
>
> If the product of these four fractions is given in its lowest common terms, find the value of the denominator.

We'll solve the more general problem of finding all curious fractions where the numerator and denominator each have $N$ digits, and cancelling exactly $K$ matching non-zero digits preserves the fraction's value. The original problem corresponds to $N = 2$ and $K = 1$.

For the original problem, we can show that only one of four possible cancellation patterns can give non-trivial solutions. With single digits $1 \le a < b \le 9$ and cancelled digit $1 \le c \le 9$ we see that

```math
\begin{align}
  \frac{10a + c}{10b + c} = \frac{a}{b} &\implies a = b \\
  \frac{10c + a}{10c + b} = \frac{a}{b} &\implies a = b \\
  \frac{10c + a}{10b + c} = \frac{a}{b} &\implies c(10b - a) = 9ab \\
  \frac{10a + c}{10c + b} = \frac{a}{b} &\implies c(10a - b) = 9ab
\end{align}
```

The first two collapse to $a = b$, but $a < b$ so no solutions here. The third has no integer solutions for single digits (there are no integer solutions for $c$). Only the fourth case has solutions, meaning the cancelled digit always sits as the second digit of the numerator and the first digit of the denominator. Solving $c = 9ab / (10a - b)$ for integer $c \in \lbrace 1, \dots, 9 \rbrace$ we get the four curious fractions:

```math
\frac{1\cancel{6}}{\cancel{6}4} = \frac{1}{4}, \quad \frac{1\cancel{9}}{\cancel{9}5} = \frac{1}{5}, \quad \frac{2\cancel{6}}{\cancel{6}5} = \frac{2}{5}, \quad \frac{4\cancel{9}}{\cancel{9}8} = \frac{4}{8}
```

Unfortunately this case-by-case analysis doesn't generalize cleanly to arbitrary $N$ and $K$, so we'll use a bucketing approach instead. We want pairs $(n, m)$ where cancelling the same digits leaves $r_n$ in the numerator and $r_m$ in the denominator with $n/m = r_n/r_m$. Cross-multiplying gives us the equivalent condition $n/r_n = m/r_m$, which means we can compute a single ratio per number and look for matches rather than comparing every pair. We also need the cancelled digits themselves to match, so we key each entry using (sorted cancelled digits, $n / r_n$) and any two numbers landing in the same bucket form a curious fraction.

For example, $16$ cancelling its $6$ leaves $r_n = 1$ and gives key $(6, 16)$, while $64$ cancelling its $6$ leaves $r_m = 4$ and gives key $(6, 64/4) = (6, 16)$. Same bucket, so $16/64 = 1/4$.

```julia
using Combinatorics: combinations

function find_curious_fractions(N, K)
    lo = 10^(N - 1)
    hi = 10^N - 1

    # Group numbers by (cancelled_digits, ratio) where ratio = n // leftover,
    # emitting pairs as each group grows.
    groups = Dict{Tuple{Vector{Int},Rational{Int}},Vector{Int}}()
    result = Set{Tuple{Int,Int}}()

    for n in lo:hi
        ds = digits(n; pad=N)

        # We want most significant bit first. Otherwise `rem` (built below) ends up digit-reversed.
        reverse!(ds)

        for pos in combinations(1:N, K)
            cancelled = sort!([ds[p] for p in pos])

            # Skip trivial cases like 30/50 or 410/790
            0 in cancelled && continue

            rem = 0
            for i in 1:N
                i in pos && continue
                rem = 10rem + ds[i]
            end
            rem == 0 && continue

            members = get!(Vector{Int}, groups, (cancelled, n // rem))

            # Don't hit the same butcket again (e.g. 11 with K=1).
            n in members && continue

            for m in members
                push!(result, (m, n))
            end
            push!(members, n)
        end
    end

    return sort!(collect(result))
end
```

For each $N$-digit number we iterate through all $\binom{N}{K}$ ways to pick cancellation positions. The cancelled digits are sorted (since their order doesn't matter for matching) and the leftover $r_n$ is built from the kept digits. We skip cases where any cancelled digit is zero (the trivial cases like $30/50$ or $410/790$) or where the leftover is zero (no valid fraction). We then construct the bucket key which combines the sorted cancelled multiset with $n / r_n$.

We had to make a decision on the "no zeros" filter. If the cancelled digits include a zero we skip it. This is because for $N \ge 3$ there's a broader family of interior-zero cancellations like $102/204 = 12/24$. I feel like we want to be searching for algebraic coincidences like $16/64$, so we group them with the trivial cases and exclude them.

```julia
function multiply_curious_fractions(N, K)
    fractions = find_curious_fractions(N, K)
    p = prod(BigInt(n) // BigInt(d) for (n, d) in fractions)
    return length(fractions), p
end
```

For the original problem ($N = 2, K = 1$) the answer is computed in @benchmark[problem-0033:multiply_curious_fractions_N2_K1].

We can extend the search to larger $N$ and $K$:

| $N$ | $K$ | Curious fractions | Product                                                | Time                                                  |
|-----|-----|-------------------|--------------------------------------------------------|-------------------------------------------------------|
| 2   | 1   | 4                 | $1/-$                                                  | @benchmark[problem-0033:multiply_curious_fractions_N2_K1] |
| 3   | 2   | 26                | $8/49{,}029{,}632{,}505$                               | @benchmark[problem-0033:multiply_curious_fractions_N3_K2] |
| 4   | 1   | 4,123             | $1/(1.170\ldots \times 10^{1516})$                     | @benchmark[problem-0033:multiply_curious_fractions_N4_K1] |
| 4   | 3   | 69                | $52{,}301{,}766{,}015 / (1.524\ldots \times 10^{30})$  | @benchmark[problem-0033:multiply_curious_fractions_N4_K3] |

Curious fractions are an example of [anomalous cancellation](https://mathworld.wolfram.com/AnomalousCancellation.html)!

One small note: MathWorld counts anomalously cancelling proper fractions with $n$ digits in both numerator and denominator as $0, 4, 161, 1851, \ldots$ for $n = 1, 2, 3, 4, \ldots$. Our $(2, 1) = 4$ matches, but the larger cases don't. For $(3, 1)$ we get 241, not 161. This is probably because MathWorld's definition of "non-trivial" is stricter than the one used by [HackerRank's Project Euler+ problem 33](https://www.hackerrank.com/contests/projecteuler/challenges/euler033/problem), which is the definition we're using. HackerRank only requires that the cancellation step itself doesn't involve a zero, while MathWorld likely restricts to fractions where neither side contains a zero digit anywhere like $165/660 = 15/60 = 1/4$.
