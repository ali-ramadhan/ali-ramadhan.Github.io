---
layout: "project-euler-post"
problem_number: 24
problem_name: "Lexicographic Permutations"
date: 2025-12-16
difficulty: 5
benchmark_file: "problem-0024"
benchmark_key: "solution"
---

> A permutation is an ordered arrangement of objects. For example, 3124 is one possible permutation of the digits 1, 2, 3 and 4. If all of the permutations are listed numerically or alphabetically, we call it lexicographic order. The lexicographic permutations of 0, 1 and 2 are:
>
> <p style="text-align: center;">012 &nbsp; 021 &nbsp; 102 &nbsp; 120 &nbsp; 201 &nbsp; 210</p>
>
> What is the millionth lexicographic permutation of the digits 0, 1, 2, 3, 4, 5, 6, 7, 8 and 9?

The naive approach would be to generate all $10! = 3,628,800$ permutations, sort them, and pick the millionth one. But we can do much better by using the [factorial number system](https://en.wikipedia.org/wiki/Factorial_number_system) to directly compute the $n$th permutation.

Permutations in lexicographic order have a predictable structure. For $n$ elements, the permutations are grouped into $n$ sets of $(n-1)!$ permutations each. The first $(n-1)!$ permutations all start with the smallest element (0 in our case), the next $(n-1)!$ start with the second smallest (1 in our case), and so on.

With the digits 0-9, we have $9! = 362,880$ permutations starting with 0, then $362,880$ starting with 1, etc. To find which digit comes first in the millionth permutation, we compute $\lfloor (1,000,000 - 1) / 9! \rfloor = \lfloor 999,999 / 362,880 \rfloor = 2$, meaning the first digit of the answer is the element at index 2 which is 2.

For the second digit, we take the remainder $999,999 \mod 362,880 = 274,239$ and repeat with the remaining elements $[0, 1, 3, 4, 5, 6, 7, 8, 9]$. We compute $\lfloor 274,239 / 8! \rfloor = \lfloor 274,239 / 40,320 \rfloor = 6$, so the second digit is the element at index 6 from the remaining list, which is 7.

This process continues for all 10 positions, each time dividing by the appropriate factorial, selecting the element at that index, and using the remainder for the next iteration.

This technique is formally known as _unranking_ in a [combinatorial number system](https://en.wikipedia.org/wiki/Combinatorial_number_system): given a rank $n$, we compute the corresponding permutation directly without generating the preceding ones.

The sequence of indices we compute $[2, 6, 6, 2, 5, 1, 2, 1, 1, 0]$ is also known as the [Lehmer code](https://en.wikipedia.org/wiki/Lehmer_code) for the permutation. Each element represents how many remaining available elements are smaller than the chosen one at that position, encoding the permutation in factorial base.

```julia
function find_nth_permutation(elements, n)
    elements = deepcopy(collect(elements))

    # Convert to 0-based indexing
    n = n - 1

    result = similar(elements, 0)

    for i in length(elements):-1:1
        fact = factorial(i-1)

        idx = n ÷ fact + 1
        push!(result, elements[idx])

        deleteat!(elements, idx)

        n = n % fact
    end

    return result
end
```

The algorithm iterates through each position. At each step, it divides by $(i-1)!$ to determine which of the remaining elements goes in the current position, appends that element to the result, removes it from the available elements, and takes the remainder for the next iteration.

```julia
function solve()
    digits = 0:9
    perm = find_nth_permutation(digits, 1_000_000)
    return join(string.(perm))
end
```

The answer is computed in @benchmark[problem-0024:solution].
