---
layout: "blog-post"
title: "Problem 1: Multiples of 3 or 5"
date: 2024-09-09
---

# Problem 1: Multiples of 3 or 5

## Problem Statement

If we list all the natural numbers below 10 that are multiples of 3 or 5, we get 3, 5, 6 and 9. The sum of these multiples is 23.

**Find the sum of all the multiples of 3 or 5 below 1000.**

## Analysis

This is a classic introductory problem that can be solved in multiple ways:

1. **Brute force**: Loop through all numbers below 1000 and check if divisible by 3 or 5
2. **Mathematical approach**: Use the formula for arithmetic series

The mathematical approach is more elegant and efficient, especially for larger numbers.

## Solution

### Approach 1: Brute Force

```python
def sum_multiples_brute_force(limit):
    total = 0
    for i in range(limit):
        if i % 3 == 0 or i % 5 == 0:
            total += i
    return total

result = sum_multiples_brute_force(1000)
print(f"Sum of multiples of 3 or 5 below 1000: {result}")
```

### Approach 2: Mathematical Formula

We can use the inclusion-exclusion principle:

- Sum of multiples of 3 + Sum of multiples of 5 - Sum of multiples of 15

```python
def sum_multiples_formula(limit):
    def sum_divisible_by(n, limit):
        # Sum of arithmetic series: n + 2n + 3n + ... + kn
        # where kn < limit
        k = (limit - 1) // n
        return n * k * (k + 1) // 2

    return (sum_divisible_by(3, limit) +
            sum_divisible_by(5, limit) -
            sum_divisible_by(15, limit))

result = sum_multiples_formula(1000)
print(f"Sum of multiples of 3 or 5 below 1000: {result}")
```

## Answer

The sum of all multiples of 3 or 5 below 1000 is **233,168**.

## Performance Comparison

- **Brute force**: O(n) time complexity
- **Mathematical**: O(1) time complexity

The mathematical approach scales much better for larger values.

## Navigation

- [← Back to Project Euler Solutions](/blog/posts/project-euler-solutions/)
- [Next Problem →](/blog/project_euler/problem-002/)
