---
layout: "project-euler-post"
problem_number: 27
problem_name: "Quadratic Primes"
date: 2025-12-18
difficulty: 5
benchmark_file: "problem-0027"
benchmark_key: "find_quadratic_with_most_primes_1000"
---

> Euler discovered the remarkable quadratic formula:
>
> ```math
> n^2 + n + 41
> ```
>
> It turns out that the formula will produce $40$ primes for the consecutive integer values $0 \le n \le 39$. However, when $n = 40$, $40^2 + 40 + 41 = 40(40 + 1) + 41$ is divisible by $41$, and certainly when $n = 41$, $41^2 + 41 + 41$ is clearly divisible by $41$.
>
> The incredible formula $n^2 - 79n + 1601$ was discovered, which produces $80$ primes for the consecutive values $0 \le n \le 79$. The product of the coefficients, $-79$ and $1601$, is $-126479$.
>
> Considering quadratics of the form:
>
> $n^2 + an + b$, where $|a| < 1000$ and $|b| \le 1000$
>
> where $|n|$ is the modulus/absolute value of $n$<br>
> e.g. $|11| = 11$ and $|-4| = 4$
>
> Find the product of the coefficients, $a$ and $b$, for the quadratic expression that produces the maximum number of primes for consecutive values of $n$, starting with $n = 0$.

To find the best quadratic in the search space, we could test all $(a, b)$ pairs with $|a| < 1000$ and $|b| \le 1000$, giving us about $1999 \times 2001 \approx 4 \times 10^6$ combinations. But we can cut down the search space significantly using a few observations.

First, $b$ must be prime because when $n = 0$, the expression $n^2 + an + b = b$, so $b$ itself must be prime. Second, $b$ must be odd because if $b = 2$, then for $n = 1$ we get $1 + a + 2 = 3 + a$. For this to be prime and the sequence to continue, we'd need $3 + a$ to be odd, meaning $a$ must be even. But then for $n = 2$ we get $4 + 2a + 2 = 6 + 2a$, which is always even. So $b = 2$ can produce at most 2 consecutive primes, which is not enough.

Third, $a$ must also be odd since $b$ is an odd prime, if $a$ were even then $n^2 + an + b$ would alternate between odd and even as $n$ increases, making long prime runs impossible. And fourth, $1 + a + b$ must be prime because when $n = 1$, the expression gives $1 + a + b$, which must be prime. This means instead of iterating over all odd values of $a$, we can iterate over primes $p = 1 + a + b$ and compute $a = p - b - 1$.

For each $(a, b)$ pair, we count how many consecutive primes the quadratic produces starting from $n = 0$:

```julia
function count_consecutive_primes(a, b)
    n = 0

    while true
        value = n^2 + a*n + b

        if value < 0 || !is_prime(value)
            break
        end

        n += 1
    end

    return n
end
```

We stop when the value is not a prime number or the values start to go negative.

Using our constraints, we iterate over odd primes $b$ and primes $p$ (where $a = p - b - 1$):

```julia
function find_quadratic_with_most_primes(; a_max=1000, b_max=1000)
    max_prime_count = 0
    best_a = 0
    best_b = 0

    b_primes = [p for p in 3:b_max if is_prime(p)]

    for b in b_primes
        for p in 3:(a_max + b)
            if !is_prime(p)
                continue
            end

            a = p - b - 1

            if a >= a_max
                break
            end

            count = count_consecutive_primes(a, b)

            if count > max_prime_count
                max_prime_count = count
                best_a = a
                best_b = b
            end
        end
    end

    return best_a, best_b, max_prime_count
end
```

The winning quadratic is $n^2 - 61n + 971$, which produces 71 consecutive primes. The answer is computed in @benchmark[problem-0027:find_quadratic_with_most_primes_1000].

Extending the search to $|a| < 10^4$ and $|b| \le 10^4$ takes @benchmark[problem-0027:find_quadratic_with_most_primes_10k] and finds $n^2 - 79n + 1601$, which produces 80 consecutive primes. This is the one mentioned in the problem description.

Extending the search to $|a| < 10^5$ and $|b| \le 10^5$ doesn't find a better polynomial. It only took a few minutes to run on the AMD Ryzen Threadripper 7960X but I didn't want to run this longer-running benchmark on every CPU.

Interestingly, $n^2 - 79n + 1601$ actually factors as $(n - 40)^2 + (n - 40) + 41$, which is just Euler's original formula shifted by 40 so it produces the same 40 primes twice each. These are all examples of [prime-generating polynomials](https://en.wikipedia.org/wiki/Formula_for_primes#Prime_formulas_and_polynomial_functions). Euler's one, $n^2 + n + 41$, was discovered in 1772 and $n^2 - 79n + 1601$ was found in 1979. There are quite a few examples on the [MathWorld article on prime-generating polynomials](https://mathworld.wolfram.com/Prime-GeneratingPolynomial.html).

Kinda spooky but the discriminant of $n^2 - 79n + 1601$ is $\Delta = a^2 - 4b = -163$ which is the largest [Heegner number](https://en.wikipedia.org/wiki/Heegner_number). These numbers are featured in the [Heegner bonus problem](/blog/project-euler/bonus-heegner/).
