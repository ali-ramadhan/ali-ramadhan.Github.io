---
layout: "blog-post"
title: "Project Euler Solutions"
numberHeaders: false
---

[Project Euler](https://projecteuler.net/) is a massive collection of cool problems that combine math and coding. They're pretty fun to solve and I enjoy writing up my solutions and benchmarking them, especially on much larger inputs. Sometimes I also like to tackle more general problems than the ones presented. I solve the problems using [Julia](https://julialang.org/). The code is available on GitHub in [ProjectEulerSolutions.jl](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl) along with tests and benchmarks.

Project Euler strongly discourages the sharing or publishing of any solutions beyond the first 100 problems. I disagree with this stance though. I think nobody should be sharing or publishing the numerical answers so that others can just copy paste without putting in any effort or learning anything. But I also think we should be encouraging high-quality explanations and derivations, good quality code, and explorations beyond the original problems. I do learn a lot by getting stuck and struggling through problems (some of which I keep revisiting for years) but I also learn a ton from others who share their solutions.

## Benchmarks

I benchmark code using the [BenchmarkTools.jl](https://github.com/JuliaCI/BenchmarkTools.jl) package. Currently I benchmark on a range of modern AMD CPUs including the Threadripper 7960X, Ryzen 9 5900X, and a couple of dual server CPUs: the EPYC 7402 and EPYC 9374F. Also the Intel Core Ultra 5 238V from a Surface Pro, the Core i7-7700HQ from an older Dell XPS laptop, and the Core i7-4810MQ from an older Dell Precision laptop. I'm working on getting access to some older hardware (think Core 2 Duo or Core 2 Quad) for benchmarking purposes, and I'd like to also benchmark on at least one Mac.

## Problems

<div class="euler-problems">
{% for problem in collections.euler %}
  <div class="euler-problem">
    {{ problem.data.problem_number }}. <a href="{{ problem.url }}">{{ problem.data.problem_name }}</a>
  </div>
{% endfor %}
</div>

## Bonus problems

- [-1](/blog/project-euler/bonus-minus1/)
- [√13](/blog/project-euler/bonus-root13/)
- [Heegner](/blog/project-euler/bonus-heegner/)
- [18i](/blog/project-euler/bonus-18i/)
