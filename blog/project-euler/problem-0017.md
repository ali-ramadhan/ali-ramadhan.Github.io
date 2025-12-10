---
layout: "project-euler-post"
problem_number: 17
problem_name: "Number Letter Counts"
date: 2025-12-10
---

> If the numbers $1$ to $5$ are written out in words: one, two, three, four, five, then there are $3 + 3 + 5 + 4 + 4 = 19$ letters used in total.
> If all the numbers from $1$ to $1000$ (one thousand) inclusive were written out in words, how many letters would be used?
>
> *NOTE:* Do not count spaces or hyphens. For example, $342$ (three hundred and forty-two) contains $23$ letters and $115$ (one hundred and fifteen) contains $20$ letters. The use of "and" when writing out numbers is in compliance with British usage.

The main thing to do here will be to write some code to convert a number to a string when it is written out. Up to 20 we have unique names which we can store in a dictionary `NUMBER_WORDS` and just pull them out as needed.

Between 20 and 100 we can start generating the strings by concatenating the tens and the ones. For example, 74 is just "seventy" and "four". By adding all the tens to `NUMBER_WORDS` we can generate all numbers up to 100 this way.

Between 100 and 1000 it gets a bit more complicated in that we need to figure out how many hundreds but then the leftover tens and ones can be converted to a string recursively. For example, 731 is "seven hundred and thirty-one". We can figure out the "seven hundred and" part just by looking at the hundreds, and we can call the `number_to_words` function again to convert the leftover 31 to "thirty-one".

We can code this logic up:

```julia
const NUMBER_WORDS = Dict(
    1 => "one",
    2 => "two",
    3 => "three",
    4 => "four",
    5 => "five",
    6 => "six",
    7 => "seven",
    8 => "eight",
    9 => "nine",
    10 => "ten",
    11 => "eleven",
    12 => "twelve",
    13 => "thirteen",
    14 => "fourteen",
    15 => "fifteen",
    16 => "sixteen",
    17 => "seventeen",
    18 => "eighteen",
    19 => "nineteen",
    20 => "twenty",
    30 => "thirty",
    40 => "forty",
    50 => "fifty",
    60 => "sixty",
    70 => "seventy",
    80 => "eighty",
    90 => "ninety",
)

function number_to_words(n)
    if n == 1000
        return "one thousand"
    elseif n >= 100
        hundreds_digit = n ÷ 100
        remainder = n % 100

        if remainder == 0
            return "$(NUMBER_WORDS[hundreds_digit]) hundred"
        else
            return "$(NUMBER_WORDS[hundreds_digit]) hundred and $(number_to_words(remainder))"
        end
    elseif n > 20
        tens = (n ÷ 10) * 10
        ones = n % 10

        if ones == 0
            return NUMBER_WORDS[tens]
        else
            return "$(NUMBER_WORDS[tens])-$(NUMBER_WORDS[ones])"
        end
    else
        return NUMBER_WORDS[n]
    end
end
```

Now that we can convert any number from 1 to 1000 into words we just need to sum over all the letters taking care to not count spaces and hyphens.

```julia
function count_letters(str)
    return length(filter(c -> !isspace(c) && c != '-', str))
end

function count_letters_in_range(start, stop)
    return sum(count_letters(number_to_words(n)) for n in start:stop)
end
```

Using this we can compute the answer in @benchmark[problem-0017:range_1_1000].
