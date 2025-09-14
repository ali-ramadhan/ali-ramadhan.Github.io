---
layout: "blog-post"
title: "Project Euler Notes"
---

[Project Euler](https://projecteuler.net/) combines mathematical problem solving with computer programming.

I solve the problems using [Julia](https://julialang.org/) and benchmark code using
[BenchmarkTools.jl](https://github.com/JuliaCI/BenchmarkTools.jl).

<div class="euler-problems">
{% for problem in collections.euler %}
  <div class="euler-problem">
    <h2 class="no-auto-numbering">{{ problem.data.problem_number }}. <a href="{{ problem.url }}">{{ problem.data.subtitle }}</a></h2>
  </div>
{% endfor %}
</div>
