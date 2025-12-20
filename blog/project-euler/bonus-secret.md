---
layout: "project-euler-post"
bonus_problem: true
bonus_problem_number: 5
problem_name: "Secret"
date: 2025-12-17
benchmark_file: "bonus-secret"
benchmark_key: "solution"
---

> <figure class="centered">
>   <img src="/assets/blog/project-euler/bonus_secret_statement.png">
> </figure>
>
> Transcription:
>
> Find the secret word by following the instructions below.
>
> The statement of this problem is contained in an image.<br>
> Starting with this image, at each step, simultaneously replace each pixel with the sum of its four neighbours in orthogonal directions.<br>
> Note that, although the original pixels are represented by 8-bit integers, in later steps they can be arbitrarily large without any integer overflow.
>
> The edges of the image are considered "glued" in such a way that pixels on the top edge are neighbours to those on the bottom edge; and similarly for left and right edges.
>
> After $10^{12}$ steps, the secret word will be revealed by taking each pixel modulo $7$.

This is a linear [cellular automaton](https://en.wikipedia.org/wiki/Cellular_automaton) on a toroidal grid. At each step, every pixel is replaced by the sum of its four orthogonal neighbors (up, down, left, right). The "glued edges" make the grid a [torus](https://en.wikipedia.org/wiki/Torus) so that pixels on opposite edges are neighbors. You can also think of it as [2D periodic or toroidal boundary conditions](https://en.wikipedia.org/wiki/Periodic_boundary_conditions).

Actually simulating $10^{12}$ steps is computationally infeasible. So we need a way to skip through most of the steps.

## Finding the convolution kernel

To understand the problem, imagine a single white pixel (value 1) in the center of a black grid (value 0).

After one step, the center pixel becomes 0 (it has no value from neighbors initially), and its four neighbors each become 1. After two steps, those four pixels spread to their neighbors, and some paths overlap in the center.

Mathematically, we can represent the image as a polynomial $P(x, y)$ where the pixel at position $(i, j)$ is the coefficient of $x^i y^j$. Replacing each pixel with the sum of its four neighbors is equivalent to multiplying by the kernel:

```math
K = x + x^{-1} + y + y^{-1}
```

This works because if pixel $(i, j)$ has value $p_{i,j}$, it contributes $p_{i,j} x^i y^j$ to the polynomial. Multiplying by $K$:

```math
K \cdot p_{i,j} x^i y^j = p_{i,j} \left( x^{i+1} y^j + x^{i-1} y^j + x^i y^{j+1} + x^i y^{j-1} \right)
```

So the value $p_{i,j}$ gets distributed to its four neighbor positions: $(i+1, j)$, $(i-1, j)$, $(i, j+1)$, and $(i, j-1)$.

Now consider what value ends up at position $(i, j)$ after multiplying the entire image $P(x, y)$ by $K$. We need to collect all contributions to $x^i y^j$. From the left neighbor, $p_{i-1,j} x^{i-1} y^j$ multiplied by $x$ will contribute $p_{i-1,j}$. Similarly, the right neighbor multiplied by $x^{-1}$ will contribute $p_{i+1,j}$, the bottom neighbor multiplied by $y$ will contribute $p_{i,j-1}$, and the top neighbor multiplied by $y^{-1}$ will contribute $p_{i,j+1}$.

So the new value at $(i, j)$ is exactly:

```math
p_{i-1,j} + p_{i+1,j} + p_{i,j-1} + p_{i,j+1}
```

which is the sum of the four orthogonal neighbors. After $n$ steps, we've multiplied by $K^n$. This is a [convolution](https://en.wikipedia.org/wiki/Convolution).

## The Frobenius Endomorphism

Now, working _modulo 7_ becomes useful because 7 is a prime number.

The [binomial theorem](https://en.wikipedia.org/wiki/Binomial_theorem) tells us that

```math
(a + b)^n = \sum_{k=0}^{n} \binom{n}{k} a^k b^{n-k}
```

where the coefficients $\binom{n}{k}$ are entries of [Pascal's Triangle](https://en.wikipedia.org/wiki/Pascal%27s_triangle). For $(a + b)^7$:

```math
(a + b)^7 = a^7 + 7a^6b + 21a^5b^2 + 35a^4b^3 + 35a^3b^4 + 21a^2b^5 + 7ab^6 + b^7
```

The 7th row of Pascal's Triangle is: 1, 7, 21, 35, 35, 21, 7, 1. Every coefficient except the first and last is divisible by 7. This will be true whenever $n$ is prime!

For any prime $p$, the binomial coefficient $\binom{p}{k} = \frac{p!}{k!(p-k)!}$ is divisible by $p$ whenever $0 < k < p$ because the numerator $p!$ contains the factor $p$, but since $p$ is prime and $k < p$, neither $k!$ nor $(p-k)!$ contains $p$ as a factor. So $p$ survives in the quotient.

This means that modulo 7:

```math
(a + b)^7 \equiv a^7 + b^7 \pmod{7}
```

This identity is called the [Frobenius endomorphism](https://en.wikipedia.org/wiki/Frobenius_endomorphism). It's also called the [Freshman's Dream](https://en.wikipedia.org/wiki/Freshman%27s_dream) because it looks like a common mistake, but it's true in our case!

Applied to our kernel $K = x + x^{-1} + y + y^{-1}$, we get:

```math
K^7 \equiv x^7 + x^{-7} + y^7 + y^{-7} \pmod{7}
```

This means that applying the neighbor-sum operation 7 times is equivalent to summing neighbors at distance 7 instead of distance 1. And $7^k$ steps equal one "jump" to neighbors at distance $7^k$:

```math
K^{7^k} \equiv x^{7^k} + x^{-7^k} + y^{7^k} + y^{-7^k} \pmod{7}
```

## Base-7 decomposition

To reach $10^{12}$ steps, we decompose the number in base 7:

```math
10^{12} = \sum_{k=0}^{15} c_k \cdot 7^k
```

where each $c_k \in \lbrace 0, 1, \ldots, 6 \rbrace$. Since $7^{15} > 10^{12}$, we need at most 16 digits.

For each digit $c_k$, we apply $c_k$ sparse operations where neighbors are collected at distance $7^k$ (with toroidal boundary conditions). Instead of $10^{12}$ iterations taking one step each, we only need 16 iterations with each iteration $k$ taking $7^k$ steps at once.

## Implementation

Here's the Julia implementation using `circshift` to handle the toroidal boundary conditions:

```julia
function simulate_cellular_automaton(grid, total_steps, modulo)
    # Work strictly in Z_modulo
    grid = grid .% modulo

    current_steps = total_steps
    power = 0

    while current_steps > 0
        digit = current_steps % modulo
        current_steps = div(current_steps, modulo)

        shift = modulo^power

        # Apply operator 'digit' times at this scale
        for _ in 1:digit
            up = circshift(grid, (shift, 0))
            down = circshift(grid, (-shift, 0))
            left = circshift(grid, (0, shift))
            right = circshift(grid, (0, -shift))

            grid = (up .+ down .+ left .+ right) .% modulo
        end

        power += 1
    end

    return grid
end
```

Now we just need to load the PNG image and convert it to a 2D grid of integers so that we can call `simulate_cellular_automaton` on it. Once the simulation is done, we convert the grid to a grayscale PNG and save it.

```julia
using PNGFiles
using ColorTypes: Gray

function solve()
    # Load the problem image
    image_filepath = "bonus_secret_statement.png"
    img = PNGFiles.load(image_filepath)

    # Convert to grayscale and extract pixel values as integers (0-255)
    gray_img = Gray.(img)
    grid = Int.(round.(Float64.(gray_img) .* 255))

    # Simulate!
    total_steps = 10^12
    modulo = 7
    result = simulate_cellular_automaton(grid, total_steps, modulo)

    # Scale to [0, 1]
    scaled_result = Gray.(result ./ modulo)

    # Save the result
    output_path = "bonus_secret_result.png"
    PNGFiles.save(output_path, scaled_result)

    return nothing
end
```

This runs in @benchmark[bonus-secret:solution]. Modulo 7 gives us enough contrast to easily read the resulting image.

## How do you even do this?

I have no idea how you would generate the problem description from the image with the secret message. Honestly seems like black magic to me. Hoping to come back and figure this out.
