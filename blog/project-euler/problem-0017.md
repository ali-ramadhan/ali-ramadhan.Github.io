---
layout: "project-euler-post"
problem_number: 17
problem_name: "Number Letter Counts"
date: 2025-12-10
benchmark_file: "problem-0017"
benchmark_key: "range_1_1000"
---

> If the numbers $1$ to $5$ are written out in words: one, two, three, four, five, then there are $3 + 3 + 5 + 4 + 4 = 19$ letters used in total.
> If all the numbers from $1$ to $1000$ (one thousand) inclusive were written out in words, how many letters would be used?
>
> _NOTE:_ Do not count spaces or hyphens. For example, $342$ (three hundred and forty-two) contains $23$ letters and $115$ (one hundred and fifteen) contains $20$ letters. The use of "and" when writing out numbers is in compliance with British usage.

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler017/problem) flips the task: instead of counting letters it asks you to write out any $N \leqslant 10^{12}$ in words (without the British "and"), with up to $10$ queries per run. That's a different enough problem that this post doesn't cover it, but the [submission](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl/blob/main/hacker_rank/projecteuler+_problem0017.jl) is in the repo.
:::

The main thing to do here will be to write some code to convert a number to a string when it is written out. Up to 20 we have unique names which we can store in a dictionary `NUMBER_WORDS` and just pull them out as needed.

Between 20 and 100 we can start generating the strings by concatenating the tens and the ones. For example, 74 is just "seventy" and "four". By adding all the tens to `NUMBER_WORDS` we can generate all numbers up to 100 this way.

Between 100 and 1000 it gets a bit more complicated in that we need to figure out how many hundreds but then the leftover tens and ones can be converted to a string recursively. For example, 731 is "seven hundred and thirty-one". We can figure out the "seven hundred and" part just by looking at the hundreds, and we can call the `number_to_words` function again to convert the leftover 31 to "thirty-one".

We can code this logic up:

@code[problem-0017:NUMBER_WORDS,number_to_words]

Now that we can convert any number from 1 to 1000 into words we just need to sum over all the letters taking care to not count spaces and hyphens.

@code[problem-0017:count_letters,count_letters_in_range]

Using this we can compute the answer in @benchmark[problem-0017:range_1_1000].
