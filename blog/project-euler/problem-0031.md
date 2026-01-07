---
layout: "project-euler-post"
problem_number: 31
problem_name: "Coin Sums"
date: 2026-01-05
difficulty: 5
benchmark_file: "problem-0031"
benchmark_key: "uk_200p"
---

> In the United Kingdom the currency is made up of pound (£) and pence (p). There are eight coins in general circulation:
>
> 1p, 2p, 5p, 10p, 20p, 50p, £1 (100p), and £2 (200p).
>
> It is possible to make £2 in the following way:
>
> 1×£1 + 1×50p + 2×20p + 1×5p + 1×2p + 3×1p
>
> How many different ways can £2 be made using any number of coins?

We could implement a naive recursive approach but it would be super slow without memoization. But the main problem is that it would count permutations as distinct: using 1p then 2p would be counted separately from 2p then 1p.

We can take a dynamic programming approach where we build up a 1D array `ways` where `ways[amount + 1]` stores the number of ways to make `amount` (since Julia starts counting from 1). The base case is `ways[1] = 1` since there's exactly one way to make 0: use no coins.

Then for each coin (from smallest to largest), we consider all the ways it can contribute to each amount. By never going back to a smaller coin, we ensure each combination is counted exactly once.

```julia
function count_coin_combinations(target, coins)
    ways = zeros(Int, target + 1)
    ways[1] = 1  # ways[1] represents amount 0

    for coin in coins
        for amount in coin:target
            ways[amount + 1] += ways[amount + 1 - coin]
        end
    end

    return ways[target + 1]
end
```

The outer loop iterates through coins and the inner loop updates all amounts that can use this coin. When we process the 2p coin, for example, `ways[amount + 1]` already contains all the ways to make `amount` using only 1p coins. We then add on the ways to make `amount + 1 - 2` (which represents using one 2p coin plus all the ways to make up the remaining amount).

This runs in @benchmark[problem-0031:uk_200p]. We can test larger targets to see how the algorithm scales.

| Target | Combinations | Time                              |
|--------|--------------|-----------------------------------|
| £2     |              | @benchmark[problem-0031:uk_200p]  |
| £10    | 321,335,886  | @benchmark[problem-0031:uk_1000p] |
| $2     | 2,728        | @benchmark[problem-0031:us_200c]  |
| $10    | 2,103,596    | @benchmark[problem-0031:us_1000c] |

The US coin system (1¢, 5¢, 10¢, 25¢, 50¢, $1) has fewer denominations than the UK system (1p, 2p, 5p, 10p, 20p, 50p, £1, £2), but more importantly lacks the 2p and 20p denominations which can be used to make many more combinations.

The algorithm runs in $\mathcal{O}(nT)$ time where $n$ is the number of coins and $T$ is the target amount.

This problem feels related to the classic [change-making problem](https://en.wikipedia.org/wiki/Change-making_problem) but we want to count all combinations rather than just find the minimum number of coins.

The American [half dollar coin](https://en.wikipedia.org/wiki/Half_dollar_(United_States_coin)) (50¢) exists but seems to go in and out of circulation. The [dollar coin](https://en.wikipedia.org/wiki/Dollar_coin_(United_States)) also exists but people really prefer the [dollar bill](https://en.wikipedia.org/wiki/United_States_one-dollar_bill). The UK actually has a [£5 coin](https://en.wikipedia.org/wiki/Five_pounds_(British_coin)) but it seems mainly commemorative so I guess it didn't make it into this problem.
