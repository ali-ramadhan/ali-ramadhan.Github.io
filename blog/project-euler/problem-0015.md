---
layout: "project-euler-post"
problem_number: 15
problem_name: "Lattice Paths"
date: 2025-12-07
---

> Starting in the top left corner of a $2 \times 2$ grid, and only being able to move to the right and down, there are exactly $6$ routes to the bottom right corner.
>
> <figure class="centered">
>   <img src="/assets/blog/project-euler/0015.png">
> </figure>
>
> How many such routes are there through a $20 \times 20$ grid?

This is a pretty classic combinatorics problem. To travel from the top-left corner to the bottom-right corner of an $n \times m$ grid, we need to make exactly $n$ moves to the right and $m$ moves down for a total of $n + m$ moves. The order of these moves doesn't matter, but there are many choices.

Arranging $n$ right moves and $m$ down moves is equivalent to choosing which $n$ of the $n + m$ moves will be right moves (or which $m$ will be down moves). This is given by the [binomial coefficient](https://en.wikipedia.org/wiki/Binomial_coefficient)

```math
\binom{n+m}{n} = \binom{n+m}{m} = \frac{(n+m)!}{n! m!}
```

For the $20 \times 20$ grid we get $\binom{40}{20}$. So we don't really need to write any code but in Julia this looks like

```julia
function count_lattice_paths(n, m)
    return binomial(n+m, n)
end
```

which computes the answer in @benchmark[problem-0015:count_lattice_paths_20x20].
