---
layout: "blog-post"
title: "Project Euler Notes"
---

[Project Euler](https://projecteuler.net/) is a massive collection of cool problems that combine math and coding. They're pretty fun to solve and I enjoy writing up my solutions and benchmarking them, especially on much larger inputs. Sometimes I also like to tackle more general problems than the ones presented.

I solve the problems using [Julia](https://julialang.org/) and benchmark code using the [BenchmarkTools.jl](https://github.com/JuliaCI/BenchmarkTools.jl) package.

Project Euler strongly discourages the sharing or publishing of any solutions beyond the first 100 problems. I disagree with this stance though. I think nobody should be sharing or publishing the numerical answers so that others can just copy paste without putting in any effort or learning anything. But I also think we should be encouraging high-quality explanations and derivations, good quality code, and explorations beyond the original problems. I do learn a lot by getting stuck and struggling through problems (some of which I keep revisiting for years) but I also learn a ton from others who share their solutions.

<div class="euler-problems">
{% for problem in collections.euler %}
  <div class="euler-problem">
    {{ problem.data.problem_number }}. <a href="{{ problem.url }}">{{ problem.data.problem_name }}</a>
  </div>
{% endfor %}
</div>

<h2 class="no-auto-numbering">Bonus problems</h2>

- [-1](/blog/project-euler/bonus-minus1/)
