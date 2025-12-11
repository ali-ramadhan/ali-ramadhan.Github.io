---
layout: "project-euler-post"
problem_number: 19
problem_name: "Counting Sundays"
date: 2025-12-10
---

> You are given the following information, but you may prefer to do some research for yourself.
>
> - 1 Jan 1900 was a Monday.
> - Thirty days has September,<br>April, June and November.<br>All the rest have thirty-one,<br>Saving February alone,<br>Which has twenty-eight, rain or shine.<br>And on leap years, twenty-nine.
> - A leap year occurs on any year evenly divisible by 4, but not on a century unless it is divisible by 400.
>
> How many Sundays fell on the first of the month during the twentieth century (1 Jan 1901 to 31 Dec 2000)?

First we'll need to code up a function that tells us whether a year is a leap year based on the logic from the problem description:

```julia
function is_leap_year(year)
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
end
```

Then we need a function to give us the number of days in a certain month (which will depend on the year!):

```julia
function days_in_month(month, year)
    if month == 2  # February
        return is_leap_year(year) ? 29 : 28
    elseif month in [4, 6, 9, 11]  # April, June, September, November
        return 30
    else
        return 31
    end
end
```

Let's label Sunday as 0, Monday as 1, etc. Now we can start from January 1st, 1901 with `day_of_week = 1`. We'll go through every month between `start_year` and `end_year` and keep incrementing `day_of_week` with the number of days in each month. Each time `day_of_week == 0` that means the first of the month is a Sunday!

```julia
function count_sundays_on_first(start_year, end_year)
    # 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    day_of_week = 1

    sunday_count = 0

    for year in 1900:end_year
        for month in 1:12
            if day_of_week == 0 && year >= start_year
                sunday_count += 1
            end

            days = days_in_month(month, year)
            day_of_week = (day_of_week + days) % 7
        end
    end

    return sunday_count
end
```

Calling `count_sundays_on_first(1901, 2000)` compute the solution in @benchmark[problem-0019:years_1901_2000].

Going further, calling `count_sundays_on_first(2000, 10000)` computes 13761 Sundays falling on the first of the month between the years 2000 and 10000 in @benchmark[problem-0019:years_2000_10000].
