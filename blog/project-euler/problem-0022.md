---
layout: "project-euler-post"
problem_number: 22
problem_name: "Names Scores"
date: 2025-12-16
benchmark_file: "problem-0022"
benchmark_key: "solution"
---

> Using [names.txt](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl/blob/main/problem_data/0022_names.txt), a 46K text file containing over five-thousand first names, begin by sorting it into alphabetical order. Then working out the alphabetical value for each name, multiply this value by its alphabetical position in the list to obtain a name score.
>
> For example, when the list is sorted into alphabetical order, COLIN, which is worth $3 + 15 + 12 + 9 + 14 = 53$, is the $938$th name in the list. So, COLIN would obtain a score of $938 \times 53 = 49714$.
>
> What is the total of all the name scores in the file?

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler022/problem) reads a list of up to $N \leqslant 5200$ names from input and then asks for the scores of up to $Q \leqslant 100$ individual names rather than the total.
:::

The names file is a comma-separated list of quoted names like `"MARY","PATRICIA","LINDA",...`. We need to parse the names by removing the quotes, splitting on commas, and sorting alphabetically.

@code[problem-0022:parse_names]

Now we need a function to compute the alphabetical value of a name. Each letter contributes its position in the alphabet (A = 1, B = 2, ..., Z = 26) which we can compute by relying on the fact that the integer value of a character is its [ASCII](https://en.wikipedia.org/wiki/ASCII) value.

@code[problem-0022:name_value]

Finally, we iterate through the sorted names and compute each name's score by multiplying its alphabetical value by its position in the list.

@code[problem-0022:compute_name_scores,solve]

Putting it all together, we read the file, parse the names, and compute the total score in @benchmark[problem-0022:solution].
