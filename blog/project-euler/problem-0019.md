---
layout: "project-euler-post"
problem_number: 19
problem_name: "Counting Sundays"
date: 2025-12-10
benchmark_file: "problem-0019"
benchmark_key: "years_1901_2000"
---

> You are given the following information, but you may prefer to do some research for yourself.
>
> - 1 Jan 1900 was a Monday.
> - Thirty days has September,<br>April, June and November.<br>All the rest have thirty-one,<br>Saving February alone,<br>Which has twenty-eight, rain or shine.<br>And on leap years, twenty-nine.
> - A leap year occurs on any year evenly divisible by 4, but not on a century unless it is divisible by 400.
>
> How many Sundays fell on the first of the month during the twentieth century (1 Jan 1901 to 31 Dec 2000)?

::: hackerrank
The [HackerRank ProjectEuler+ version](https://www.hackerrank.com/contests/projecteuler/challenges/euler019/problem) counts the Sundays on the first between any two dates, with years as large as $10^{16}$ and ranges up to $1000$ years long, for up to $100$ queries per run. Counting month by month from 1900 won't reach year $10^{16}$, so this post doesn't cover it, but the [submission](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl/blob/main/hacker_rank/projecteuler+_problem0019.jl), which uses the fact that the Gregorian calendar repeats every $400$ years, is in the repo.
:::

First we'll need to code up a function that tells us whether a year is a leap year based on the logic from the problem description:

@code[problem-0019:is_leap_year]

Then we need a function to give us the number of days in a certain month (which will depend on the year!):

@code[problem-0019:days_in_month]

Let's label Sunday as 0, Monday as 1, etc. Since January 1st, 1900 was a Monday, we initialize `day_of_week = 1`. We'll loop through every month starting from 1900, and for each month we first check if it's a Sunday before advancing `day_of_week`. This way, the check happens at the *start* of each month. We only count Sundays for years within our target range (`year >= start_year`). After the check, we advance `day_of_week` by the number of days in that month (mod 7) to get the day of the week for the first of the next month.

@code[problem-0019:count_sundays_on_first]

Calling `count_sundays_on_first(1901, 2000)` computes the solution in @benchmark[problem-0019:years_1901_2000].

Going further, calling `count_sundays_on_first(2000, 10000)` computes 13761 Sundays falling on the first of the month between the years 2000 and 10000 in @benchmark[problem-0019:years_2000_10000].

An alternative approach is to use [Zeller's congruence](https://en.wikipedia.org/wiki/Zeller%27s_congruence), an algorithm that can be used to calculate the day of the week for any date. Rather than iterating through every month to track the day of the week, Zeller's formula directly computes it from the date components.
