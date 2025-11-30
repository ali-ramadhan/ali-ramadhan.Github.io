---
layout: "blog-post"
title: "Project Euler Notes"
---

[Project Euler](https://projecteuler.net/) combines mathematical problem solving with computer programming. They have tons of problems that are fun to solve. As part of the learning process, I like to document my solutions, benchmark them, and expand on them a bit sometimes.

I solve the problems using [Julia](https://julialang.org/) and benchmark code using the
[BenchmarkTools.jl](https://github.com/JuliaCI/BenchmarkTools.jl) package.

<div class="euler-problems">
{% for problem in collections.euler %}
  <div class="euler-problem">
    {{ problem.data.problem_number }}. <a href="{{ problem.url }}">{{ problem.data.problem_name }}</a>
  </div>
{% endfor %}
</div>

<h2 class="no-auto-numbering">Bonus problems</h2>

- [-1](/blog/project-euler/bonus-minus1/)
