---
layout: "project-euler-post"
problem_number: 14
problem_name: "Longest Collatz Sequence"
date: 2025-12-07
benchmark_file: "problem-0014"
benchmark_key: "longest_collatz_under_1M"
---

> The following iterative sequence is defined for the set of positive integers:
>
> <ul style="list-style-type:none;">
> <li>$n \to n/2$ ($n$ is even)</li>
> <li>$n \to 3n + 1$ ($n$ is odd)</li>
> </ul>
>
> Using the rule above and starting with $13$, we generate the following sequence:
>
> $$13 \to 40 \to 20 \to 10 \to 5 \to 16 \to 8 \to 4 \to 2 \to 1.$$
>
> It can be seen that this sequence (starting at $13$ and finishing at $1$) contains $10$ terms. Although it has not been proved yet (Collatz Problem), it is thought that all starting numbers finish at $1$.
>
> Which starting number, under one million, produces the longest chain?
>
> **NOTE:** Once the chain starts the terms are allowed to go above one million.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler014/problem) asks for the longest chain starting at or below any $N \leqslant 5 \times 10^6$ (taking the largest starting number on ties), with up to $10^4$ queries per run.
:::

It's not hard to code up a function that computes the length of the Collatz sequence for a specific integer, but computing the chain lengths of millions of numbers can take a while and involve lots of repetitive computation.

To speed things up we can use [memoization](https://en.wikipedia.org/wiki/Memoization). We use a cache (just a dictionary) and store the chain length of any integer once we compute it. Then when we encounter that integer again, we just pull out the known chain length. This way we never repeat a chain length computation.

@code[problem-0014:collatz_length,longest_collatz_under]

We find the solution in @benchmark[problem-0014:longest_collatz_under_1M].

Under $10^7$ we find that 8400511 produces the longest chain (686 terms) in @benchmark[problem-0014:longest_collatz_under_10M]. Under $10^8$ we find that 63728127 produces the longest chain (950 terms) in @benchmark[problem-0014:longest_collatz_under_100M]. Both agree with the list of starting values that produce the longest chains on [Wikipedia](https://en.wikipedia.org/wiki/Collatz_conjecture). We (and Project Euler) are counting the number of terms while Wikipedia is counting the number of steps/transitions so our chain lengths are longer by one.
