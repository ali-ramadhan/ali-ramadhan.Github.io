---
layout: "project-euler-post"
problem_number: 22
problem_name: "Names Scores"
date: 2025-12-16
---

> Using [names.txt](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl/blob/main/data/0022_names.txt), a 46K text file containing over five-thousand first names, begin by sorting it into alphabetical order. Then working out the alphabetical value for each name, multiply this value by its alphabetical position in the list to obtain a name score.
>
> For example, when the list is sorted into alphabetical order, COLIN, which is worth $3 + 15 + 12 + 9 + 14 = 53$, is the $938$th name in the list. So, COLIN would obtain a score of $938 \times 53 = 49714$.
>
> What is the total of all the name scores in the file?

The names file is a comma-separated list of quoted names like `"MARY","PATRICIA","LINDA",...`. We need to parse the names by removing the quotes, splitting on commas, and sorting alphabetically.

```julia
function parse_names(content)
    names = [replace(name, "\"" => "") for name in split(content, ",")]
    return sort(names)
end
```

Now we need a function to compute the alphabetical value of a name. Each letter contributes its position in the alphabe (A = 1, B = 2, ..., Z = 26) which we can compute by relying on the fact that the integer value of a character is its [ASCII](https://en.wikipedia.org/wiki/ASCII) value.

```julia
function name_value(name)
    return sum(ch - 'A' + 1 for ch in name)
end
```

Finally, we iterate through the sorted names and compute each name's score by multiplying its alphabetical value by its position in the list.

```julia
function compute_name_scores(names)
    total_score = 0
    for (i, name) in enumerate(names)
        name_score = i * name_value(name)
        total_score += name_score
    end
    return total_score
end

function solve()
    data_filepath = "0022_names.txt"
    content = read(data_filepath, String)
    names = parse_names(content)
    return compute_name_scores(names)
end
```

Putting it all together, we read the file, parse the names, and compute the total score in @benchmark[problem-0022:solution].
