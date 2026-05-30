---
layout: "project-euler-post"
bonus_problem: true
bonus_problem_number: 6
problem_name: "contfrac"
date: 2026-05-02
difficulty: 30
benchmark_file: "bonus-contfrac"
benchmark_key: "Q_12"
---

> Given an infinite sequence of nonnegative integers $a = (a_0, a_1, a_2, \dots)$, we can form a *negatively continued fraction*
>
> ```math
> N(a) = a_0 - \cfrac{1}{a_1 - \cfrac{1}{a_2 - \cfrac{1}{\dots}}}
> ```
>
> We are interested in the case where the sequence $a$ is **periodic**, namely there exists $n > 0$ such that $a_{n+k} = a_k$ for all $k \ge 0$. We write such a sequence as $\overline{a_0, a_1, \dots, a_{n-1}}$ where $n$ is the minimal period.
>
> As normal continued fractions, a negatively continued fraction may represent a real number. E.g. $N(\overline{2, 3})$ represents the number $\frac{3 + \sqrt 3}{3} \approx 1.57735$.
>
> However, for some periodic sequences, the negatively continued fraction may even represent a nonreal complex number. E.g. $N(\overline{1, 4, 2})$ represents the number $\frac{9 + \sqrt{-3}}{14}$. Moreover, the same complex number may be represented in different ways. E.g. $N(\overline{1, 5, 1, 3})$ also represents that same number.
>
> Let $Q(n)$ be the number of different periodic sequences $a$ such that $N(a)$ represents a (nonreal) complex number and the minimal period of $a$ does not exceed $n$. For example, $Q(1) = 2$ and $Q(2) = 6$. The sequences with minimal period $1$ are $\overline{0}$ and $\overline{1}$, and the four with minimal period $2$ are $\overline{1, 2}$, $\overline{2, 1}$, $\overline{1, 3}$, and $\overline{3, 1}$.
>
> Find $Q(12)$.

## Möbius transformations

Let's start by thinking about [Möbius transformations](https://en.wikipedia.org/wiki/M%C3%B6bius_transformation), which are functions of a complex variable $z \in \mathbb{C}$

```math
f(z) = \frac{az + b}{cz + d}
```

where $a, b, c, d \in \mathbb{C}$ and $ad - bc \neq 0$. They have some cool properties. If we have two Möbius transformations

```math
f_1(z) = \frac{a_1 z + b_1}{c_1 z + d_1}, \quad f_2(z) = \frac{a_2 z + b_2}{c_2 z + d_2} \\
```

then their composition

```math
f_2(f_1(z)) = \frac{(a_1 a_2 + b_2 c_1) z + (a_2 b_1 + b_2 d_1)}{(a_1 c_2 + c_1 d_2) z + (b_1 c_2 + d_1 d_2)}
```

is also a Möbius transformation.

We can also represent Möbius transformations with $2 \times 2$ matrices. If

```math
M_{f_1} = \begin{pmatrix} a_1 & b_1 \\ c_1 & d_1 \end{pmatrix}, \quad M_{f_2} = \begin{pmatrix} a_2 & b_2 \\ c_2 & d_2 \end{pmatrix}
```

then their composition is given by the matrix product

```math
M_{f_2} M_{f_1}
= \begin{pmatrix} a_1 & b_1 \\ c_1 & d_1 \end{pmatrix} \begin{pmatrix} a_2 & b_2 \\ c_2 & d_2 \end{pmatrix}
= \begin{pmatrix} a_1 a_2 + b_2 c_1 & a_2 b_1 + b_2 d_1 \\ a_1 c_2 + c_1 d_2 & b_1 c_2 + d_1 d_2 \end{pmatrix}
```

## From fractions to matrices

Now let's go back to the *negatively continued fraction*

```math
N(a) = a_0 - \cfrac{1}{a_1 - \cfrac{1}{a_2 - \cfrac{1}{\dots}}}
```

and notice that each step in this continued fraction is a map of the form $z \mapsto a - 1/z$ which is a Möbius transformation

```math
f(z) = \frac{a z - 1}{1 z + 0}
```

with corresponding $2 \times 2$ matrix

```math
M(a) = \begin{pmatrix} a & -1 \\ 1 & 0 \end{pmatrix}
```

So, for example, if $a = (a_0, a_1, a_2)$ then the corresponding sequence of Möbius transformations, in matrix form, is

```math
M_\text{total}
= M(a_0) M(a_1) M(a_2)
= \begin{pmatrix} a_0 & -1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} a_1 & -1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} a_2 & -1 \\ 1 & 0 \end{pmatrix}
```

But what if $a$ is infinitely periodic? Then $z \mapsto a - 1/z$ or $f(z)$ must give back $z$ and $z$ must be a fixed point. Letting

```math
M_\text{total} = \begin{pmatrix} p & q \\ r & s \end{pmatrix}
```

correspond to

```math
f(z) = \frac{pz + q}{rz + s}
```

we can solve $f(z) = z$ for $z$ to find the fixed point. Doing so gives

```math
z = \frac{pz + q}{rz + s} \implies rz^2 + (s - p) z - q = 0
```

Now since we're interested in complex solutions, we note that $z \in \mathbb{C}$ iff the
[discriminant of this quadratic](https://en.wikipedia.org/wiki/Discriminant#Degree_2) is negative:

```math
\Delta = (s - p)^2 + 4qr < 0
```

Now we notice that $\det M(a) = a \cdot 0 - (-1) \cdot 1 = 1$, so the product matrix has determinant

```math
\det M_\text{total} = \det M(a_0) \cdot \det M(a_1) \cdot \cdots \cdot \det M(a_n) = (1)^n = 1
```

Now setting $\det M_\text{total} = ps - qr = 1$ we can rewrite the discriminant as

```math
\Delta = (s - p)^2 + 4qr =  (s - p)^2 + 4(ps - 1) = (p + s)^2 - 4
```

and noticing that the [trace](https://en.wikipedia.org/wiki/Trace_(linear_algebra)) is $\operatorname{tr} M_\text{total} = p + s$ and solving $\Delta < 0$ we get

```math
\Delta < 0 \implies (p + s)^2 - 4 < 0 \implies \left(\operatorname{tr} M_\text{total}\right)^2 < 4
```

So $N(a)$ is complex if and only if $\operatorname{tr}(M_\text{total})^2 < 4$. The matrix entries are integers, so the trace is an integer, and the only integers with square less than $4$ are $-1$, $0$, and $1$. So $\operatorname{tr}(M) \in \{-1, 0, 1\}$.

So given a periodic sequence $a = (a_0, a_1, \dots, a_n)$, we can check if $N(a)$ is complex by computing $\operatorname{tr}M_\text{total}$ and checking if it's either $-1$, $0$, or $1$.

## The naive brute force approach

To find all periodic sequences $a$ such that $N(a)$ represents a (nonreal) complex number and the minimal period of $a$ does not exceed $n$, we could take a naive brute force approach and iterate over all sequences up to length $n$ and check the trace. However, the search space grows exponentially with $n$ so this will take a long time.

## Constructive enumeration

We can take a more constructive approach and just generate all valid sequences of length $n$. To do so we'll make use of the fact that the matrices that satisfy $\operatorname{tr}(M) \in \{-1, 0, 1\}$ belong to the [modular group](https://en.wikipedia.org/wiki/Modular_group) $\text{PSL}_2(\mathbb{Z})$, which is the group of $2 \times 2$ matrices with integer entries, a determinant of 1, and with $M = -M$.

It turns out that the modular group is generated by just two matrices

```math
S = \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}, \quad T = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}
```

which means that every element of the group can be written as some product of $S$'s and $T$'s. Geometrically $S$ is the inversion $z \mapsto -1/z$ and $T$ is the translation $z \mapsto z + 1$. Now powers of $T$ are easy to compute

```math
T^a = \begin{pmatrix} 1 & a \\ 0 & 1 \end{pmatrix}
```

and so

```math
T^a S = \begin{pmatrix} 1 & a \\ 0 & 1 \end{pmatrix} \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix} = \begin{pmatrix} a & -1 \\ 1 & 0 \end{pmatrix} = M(a)
```

So our matrices $M(a)$ are exactly "translate by $a$, then invert". A sequence $a = (a_0, a_1, \dots, a_{n-1})$ then corresponds to

```math
M(a_0) M(a_1) \cdots M(a_{n-1}) = T^{a_0} S T^{a_1} S \cdots T^{a_{n-1}} S
```

which we can call the word for our sequence $a$ with $n$ occurrences of $S$.

This group also has two important relations. First, $S$ squares to $-I$

```math
S^2 = \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix} = \begin{pmatrix} -1 & 0 \\ 0 & -1 \end{pmatrix} = -I
```

and second, $TS$ cubes to $-I$

```math
(TS)^3 = M(1)^3 = \begin{pmatrix} 1 & -1 \\ 1 & 0 \end{pmatrix}^3 = \begin{pmatrix} -1 & 0 \\ 0 & -1 \end{pmatrix} = -I
```

For every $M \in \text{PSL}_2(\mathbb{Z})$ we have that $M = -M$, so both $S^2$ and $(TS)^3$ are identity elements. It turns out that these two relations are the only relations the group satisfies, and so the modular group is isomorphic to the [free product](https://en.wikipedia.org/wiki/Free_product) $C_2 * C_3$ of [cyclic groups](https://en.wikipedia.org/wiki/Cyclic_group) of orders 2 and 3.

So if we splice an extra $S^2$ or $(TS)^3$ somewhere into the word for our sequence, the underlying matrix doesn't change (up to a sign), so the trace doesn't change (up to a sign), and so a valid sequence stays valid. As each insertion adds extra $S$'s to the word, which corresponds to a longer sequence, we now have a way to grow valid sequences from smaller ones. And since $S^2$ and $(TS)^3$ are the only identity elements, we can generate all valid sequences by starting with the smallest word possible and repeatedly inserting $S^2$ or $(TS)^3$.

Translating these insertions back into operations on the sequence directly gives us two rules we can use to generate longer valid sequences.

The first rule is that $(a, b) \mapsto (a+1, 1, b+1)$. This corresponds to splicing $(TS)^3$ into the word. To check that the resulting matrix product is unchanged, let's compute $M(a+1) M(1) M(b+1)$ step by step:

```math
M(a+1) M(1)
= \begin{pmatrix} a+1 & -1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} 1 & -1 \\ 1 & 0 \end{pmatrix}
= \begin{pmatrix} a & -a-1 \\ 1 & -1 \end{pmatrix}
```

and then

```math
M(a+1) M(1) M(b+1)
= \begin{pmatrix} a & -a-1 \\ 1 & -1 \end{pmatrix} \begin{pmatrix} b+1 & -1 \\ 1 & 0 \end{pmatrix}
= \begin{pmatrix} ab - 1 & -a \\ b & -1 \end{pmatrix}
```

And computing $M(a) M(b)$ directly

```math
M(a) M(b)
= \begin{pmatrix} a & -1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} b & -1 \\ 1 & 0 \end{pmatrix}
= \begin{pmatrix} ab - 1 & -a \\ b & -1 \end{pmatrix}
```

we get the same matrix exactly. So replacing any adjacent pair $(a, b)$ in the sequence with $(a+1, 1, b+1)$ leaves the matrix product (and hence the trace) unchanged, but bumps the sequence length up by one.

The second rule is that $(c) \mapsto (u, 0, c - u)$ for any $0 \le u \le c$. This corresponds to splicing in $S^2$:

```math
M(u) M(0)
= \begin{pmatrix} u & -1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}
= \begin{pmatrix} -1 & -u \\ 0 & -1 \end{pmatrix}
```

and then

```math
M(u) M(0) M(c-u)
= \begin{pmatrix} -1 & -u \\ 0 & -1 \end{pmatrix} \begin{pmatrix} c-u & -1 \\ 1 & 0 \end{pmatrix}
= \begin{pmatrix} -c & 1 \\ -1 & 0 \end{pmatrix}
= -M(c)
```

The product picks up a sign, but in $\text{PSL}_2(\mathbb{Z})$ negative matrices are the same as positive ones, so the trace condition is unaffected. $\operatorname{tr}(-M)^2 = \operatorname{tr}(M)^2$ either way. Replacing any single term $c$ with the triple $(u, 0, c - u)$ leaves the trace alone but bumps the sequence length up by two.

So we now have two ways to grow a valid sequence into a longer valid sequence. To enumerate all valid sequences up to some length $n$, all we need is a base set to grow from. After working through the small cases by hand, we end up with seven seed cycles

```math
\overline{0}, \quad \overline{1}, \quad \overline{1, 1}, \quad \overline{1, 2}, \quad \overline{2, 1}, \quad \overline{1, 3}, \quad \overline{3, 1}
```

each of which satisfies the trace condition and cannot be obtained by forward-applying either rule to a shorter cycle. Starting from these seven seeds and repeatedly applying both expansion rules generates *exactly* the valid sequences up to whatever length we want, with no wasted work on sequences that fail the trace condition.

## Canonicalization

The expansion rules treat sequences as cycles rather than ordered tuples. Rotating a sequence doesn't change the matrix product trace (since the trace is invariant under cyclic rotations of the product). So we canonicalize each generated cycle to its lexicographically smallest rotation and store it as the canonical key. To make set operations fast, we pack the canonical form into an unsigned integer with the layout `[length : 4 bits][digit_1 : 5 bits][digit_2 : 5 bits]...`. For $n \le 12$ this fits in a `UInt64` since $4 + 5 \cdot 12 = 64$ bits exactly. For $13 \le n \le 24$ we widen to `UInt128`. The packing is worth the complexity because a `Set{UInt64}` keeps keys stack-allocated and O(1)-hashed, while a `Set{Vector{Int}}` is around 6× slower when I benchmarked $Q(12)$.

```julia
const LEN_BITS = 4
const DIGIT_BITS = 5

function encode_rotated(seq, ::Type{T}=UInt64)::T where {T<:Unsigned}
    n = length(seq)
    best_s = 1
    for s in 2:n
        for k in 0:(n-1)
            a = seq[mod1(s + k, n)]
            b = seq[mod1(best_s + k, n)]
            if a < b
                best_s = s
                break
            elseif a > b
                break
            end
        end
    end

    key = T(n)
    for i in 0:(n-1)
        v = seq[mod1(best_s + i, n)]
        key |= (T(v) << (LEN_BITS + DIGIT_BITS * i))
    end
    return key
end
```

The decode is the inverse:

```julia
function decode_cycle(key::T) where {T<:Unsigned}
    len_mask = (T(1) << LEN_BITS) - T(1)
    digit_mask = (T(1) << DIGIT_BITS) - T(1)
    n = Int(key & len_mask)
    seq = Vector{Int}(undef, n)
    for i in 0:(n-1)
        seq[i+1] = Int((key >> (LEN_BITS + DIGIT_BITS * i)) & digit_mask)
    end
    return seq
end
```

The other consideration is the minimal period: a cycle like $(1, 2, 1, 2)$ has length 4 but minimal period 2, so it's already counted under length 2 as $(1, 2)$ repeated. We filter these out and only keep primitive cycles:

```julia
function is_primitive(seq)
    n = length(seq)
    for d in 1:(n-1)
        if n % d == 0
            periodic = true
            for i in 1:n
                if seq[i] != seq[mod1(i + d, n)]
                    periodic = false
                    break
                end
            end
            if periodic
                return false
            end
        end
    end
    return true
end
```

Each primitive cyclic class of length $m$ corresponds to $m$ distinct sequences (one per rotation), so the final answer is

```math
Q(n) = \sum_{m=1}^{n} m \cdot C_m
```

where $C_m$ is the number of primitive cyclic classes of length $m$.

## Implementation

To check if a sequence is valid we walk the matrix product and look at the trace. Since the modular group acts as [Möbius transformations](https://en.wikipedia.org/wiki/M%C3%B6bius_transformation#Classification), we can borrow that taxonomy: a non-identity matrix with $|\operatorname{tr}| < 2$ is called *elliptic*, $|\operatorname{tr}| = 2$ is *parabolic*, and $|\operatorname{tr}| > 2$ is *hyperbolic*. Our valid sequences are exactly those whose matrix product is elliptic, so we name the function accordingly. We use `Int128` for headroom:

```julia
function is_elliptic(seq)
    A, B = Int128(1), Int128(0)
    C, D = Int128(0), Int128(1)

    for a in seq
        nA = A * a + B
        nB = -A
        nC = C * a + D
        nD = -C
        A, B, C, D = nA, nB, nC, nD
    end

    tr = A + D
    return -1 <= tr <= 1
end
```

The two expansion rules each insert their pattern at every cyclic position. `splice_ts3!` implements Rule 1 (splice in $(TS)^3$), and `splice_s2!` implements Rule 2 (splice in $S^2$, with $u$ ranging from $0$ to $c$):

```julia
# Rule 1: (a, b) -> (a+1, 1, b+1)
function splice_ts3!(seq::Vector{Int}, out_set::Set{T}, max_n::Int) where {T<:Unsigned}
    n = length(seq)
    if n < 2 || n + 1 > max_n
        return
    end

    new_seq = Vector{Int}(undef, n + 1)
    for i in 1:n
        j = mod1(i + 1, n)

        new_seq[1] = seq[i] + 1
        new_seq[2] = 1
        new_seq[3] = seq[j] + 1

        idx = 4
        k = mod1(j + 1, n)
        while k != i
            new_seq[idx] = seq[k]
            idx += 1
            k = mod1(k + 1, n)
        end

        if is_elliptic(new_seq)
            push!(out_set, encode_rotated(new_seq, T))
        end
    end
end

# Rule 2: (c) -> (u, 0, c-u)
function splice_s2!(seq::Vector{Int}, out_set::Set{T}, max_n::Int) where {T<:Unsigned}
    n = length(seq)
    if n + 2 > max_n
        return
    end

    new_seq = Vector{Int}(undef, n + 2)
    for i in 1:n
        c = seq[i]
        for u in 0:c
            new_seq[1] = u
            new_seq[2] = 0
            new_seq[3] = c - u

            idx = 4
            k = mod1(i + 1, n)
            while k != i
                new_seq[idx] = seq[k]
                idx += 1
                k = mod1(k + 1, n)
            end

            if is_elliptic(new_seq)
                push!(out_set, encode_rotated(new_seq, T))
            end
        end
    end
end
```

The elliptic check inside each splice is technically redundant (the rules preserve the trace by construction) but it's cheap and makes the code self-validating.

The main solver dispatches on `max_n` to pick the right key type, then seeds the base cycles, expands, and counts:

```julia
function compute_Q(max_n::Int=12)
    if max_n <= 12
        return _compute_Q(max_n, UInt64)
    elseif max_n <= 24
        return _compute_Q(max_n, UInt128)
    else
        error("max_n > 24 not supported (bit-packing limit)")
    end
end

function _compute_Q(max_n::Int, ::Type{T}) where {T<:Unsigned}
    classes = [Set{T}() for _ in 1:max_n]

    seeds = [[0], [1], [1, 1], [1, 2], [2, 1], [1, 3], [3, 1]]
    for s in seeds
        if length(s) <= max_n && is_elliptic(s)
            push!(classes[length(s)], encode_rotated(s, T))
        end
    end

    for n in 1:max_n
        for key in classes[n]
            seq = decode_cycle(key)
            if n + 1 <= max_n
                splice_ts3!(seq, classes[n+1], max_n)
            end
            if n + 2 <= max_n
                splice_s2!(seq, classes[n+2], max_n)
            end
        end
    end

    q_total = 0
    for n in 1:max_n
        class_cnt = count(k -> is_primitive(decode_cycle(k)), classes[n])
        q_total += class_cnt * n
    end
    return q_total
end
```

## Benchmarks

Running `compute_Q(12)` produces the answer in @benchmark[bonus-contfrac:Q_12]. We can push beyond $n = 12$:

| $n$  | $Q(n)$       | Time                              |
|------|--------------|-----------------------------------|
| 8    | 39,189       | @benchmark[bonus-contfrac:Q_8]    |
| 10   | 797,501      | @benchmark[bonus-contfrac:Q_10]   |
| 12   |              | @benchmark[bonus-contfrac:Q_12]   |
| 13   | 75,862,288   | @benchmark[bonus-contfrac:Q_13]   |
| 14   | 348,638,246  | @benchmark[bonus-contfrac:Q_14]   |

For $n \le 12$ the bit-packed encoding fits in a `UInt64`, but at $n = 13$ a digit-by-digit packing already needs $4 + 5 \cdot 13 = 69$ bits, so we switch to `UInt128`. The growth in $Q(n)$ is exponential and so the memory consumption climbs quickly.

## Why the title?

The problem is named after the negatively continued fraction with the all-zeros sequence:

```math
N(\overline{0}) = 0 - \cfrac{1}{0 - \cfrac{1}{0 - \cfrac{1}{\dots}}}
```

Setting this equal to $z$ gives $z = -1/z$, so $z^2 = -1$ and $z = \pm i$. An infinite stack of zeros and minus signs literally evaluates to $i$!
