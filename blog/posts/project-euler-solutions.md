---
layout: "blog-post"
title: "Project Euler Solutions"
numberHeaders: false
---

[Project Euler](https://projecteuler.net/) is a massive collection of cool problems that combine math and coding. They're pretty fun to solve and I enjoy writing up my solutions and benchmarking them, especially on much larger inputs. Sometimes I also like to tackle more general problems than the ones presented. I solve the problems using [Julia](https://julialang.org/). The code is available on GitHub in [ProjectEulerSolutions.jl](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl) along with tests and benchmarks.

Project Euler strongly discourages the sharing or publishing of any solutions beyond the first 100 problems. I disagree with this stance though. I think nobody should be sharing or publishing the numerical answers so that others can just copy paste without putting in any effort or learning anything. But I also think we should be encouraging high-quality explanations and derivations, good quality code, and explorations beyond the original problems. I do learn a lot by getting stuck and struggling through problems (some of which I keep revisiting for years) but I also learn a ton from others who share their solutions.

## Benchmarks

I benchmark code using the [BenchmarkTools.jl](https://github.com/JuliaCI/BenchmarkTools.jl) package. It produces beautiful and insightful unicode plots which I embed here. You can click on any timing to see more information about each benchmark and compare benchmarks across CPUs.

Right now I benchmark on a bunch of different AMD and Intel CPUs. For AMD we have the [Ryzen Threadripper 7960X](https://www.techpowerup.com/cpu-specs/ryzen-threadripper-7960x.c3359) workstation, the [Ryzen 9 5900X](https://www.techpowerup.com/cpu-specs/ryzen-9-5900x.c2363) desktop, a dual [EPYC 7402](https://www.techpowerup.com/cpu-specs/epyc-7402.c2252) server, a dual [EPYC 9374F](https://www.techpowerup.com/cpu-specs/epyc-9374f.c2925) server, and an ancient [Phenom II X4 970](https://www.techpowerup.com/cpu-specs/phenom-ii-x4-970-be.c744) desktop server. For Intel we have the [Core Ultra 5 238V](https://www.techpowerup.com/cpu-specs/core-ultra-5-238v.c3797) from a Microsoft Surface Pro, the [Core i7-7700HQ](https://www.techpowerup.com/cpu-specs/core-i7-7700hq.c3098) from an older Dell XPS laptop, the [Core i7-4810MQ](https://www.techpowerup.com/cpu-specs/core-i7-4810mq.c1758) from an older Dell Precision laptop, and the ancient [Core 2 Duo E7400](https://www.techpowerup.com/cpu-specs/core-2-duo-e7400.c1532) desktop server.

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
