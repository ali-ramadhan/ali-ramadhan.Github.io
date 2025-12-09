---
layout: "project-euler-post"
problem_number: 13
problem_name: "Large Sum"
date: 2025-12-06
---

> Work out the first ten digits of the sum of the following one-hundred 50-digit numbers.
>
> <pre style="text-align: center; font-family: monospace; font-size: 0.9em; line-height: 1.4;">
> 37107287533902102798797998220837590246510135740250
> 46376937677490009712648124896970078050417018260538
> 74324986199524741059474233309513058123726617309629
> 91942213363574161572522430563301811072406154908250
> 23067588207539346171171980310421047513778063246676
> ...
> 53503534226472524250874054075591789781264330331690
> </pre>
>

The numbers in this problem are 50 digits long. A signed 64-bit integer can only hold values up to $2^{63} - 1 \approx 9.2 \times 10^{18}$, which is only 19 digits. So we need arbitrary precision arithmetic.

We parse each 50-digit string as a `BigInt`, sum them all, and extract the first 10 digits from the result.

```julia
const NUMBERS = [
    "37107287533902102798797998220837590246510135740250",
    "46376937677490009712648124896970078050417018260538",
    "74324986199524741059474233309513058123726617309629",
    "91942213363574161572522430563301811072406154908250",
    "23067588207539346171171980310421047513778063246676",
    ...
    "53503534226472524250874054075591789781264330331690",
]

function first_ten_digits_of_sum()
    total_sum = sum(parse(BigInt, num) for num in NUMBERS)
    sum_str = string(total_sum)
    return sum_str[1:10]
end
```

This computes the answer in @benchmark[problem-0013:first_ten_digits_of_sum].

I guess it would be slightly faster to just work with the first 12-13 digits as adding 100 numbers of 50 digits each can produce at most a 53-digit number. But for 100 numbers, I feel like it would be negligible. And maybe this problem isn't interesting enough to explore this.
