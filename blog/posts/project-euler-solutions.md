---
layout: "blog-post"
title: "Project Euler Solutions"
numberHeaders: false
github_repo: https://github.com/ali-ramadhan/ProjectEulerSolutions.jl
---

[Project Euler](https://projecteuler.net/) is a massive collection of cool problems that combine math and coding. They're pretty fun to solve and I enjoy writing up my solutions and benchmarking them, especially on much larger inputs. Sometimes I also like to tackle more general problems than the ones presented. I solve the problems using [Julia](https://julialang.org/). The code is available on GitHub in [ProjectEulerSolutions.jl](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl) along with tests and benchmarks.

Project Euler strongly discourages the sharing or publishing of any solutions beyond the first 100 problems. I disagree with this stance though. I think nobody should be sharing or publishing the numerical answers so that others can just copy paste without putting in any effort or learning anything. But I also think we should be encouraging high-quality explanations and derivations, good quality code, and explorations beyond the original problems. I do learn a lot by getting stuck and struggling through problems (some of which I keep revisiting for years) but I also learn a ton from others who share their solutions.

## Benchmarks

I benchmark code using the [BenchmarkTools.jl](https://github.com/JuliaCI/BenchmarkTools.jl) package. It produces beautiful and insightful unicode plots which I embed here. You can click on any timing to see more information about each benchmark and compare benchmarks across CPUs.

Right now I benchmark on a bunch of different AMD and Intel CPUs. For AMD we have the [Ryzen Threadripper 7960X](https://www.techpowerup.com/cpu-specs/ryzen-threadripper-7960x.c3359) workstation, the [Ryzen 9 5900X](https://www.techpowerup.com/cpu-specs/ryzen-9-5900x.c2363) desktop, a dual [EPYC 7402](https://www.techpowerup.com/cpu-specs/epyc-7402.c2252) server, a dual [EPYC 9374F](https://www.techpowerup.com/cpu-specs/epyc-9374f.c2925) server, and an ancient [Phenom II X4 970](https://www.techpowerup.com/cpu-specs/phenom-ii-x4-970-be.c744) desktop server. For Intel we have the [Core Ultra 5 238V](https://www.techpowerup.com/cpu-specs/core-ultra-5-238v.c3797) from a Microsoft Surface Pro, the [Core i7-7700HQ](https://www.techpowerup.com/cpu-specs/core-i7-7700hq.c3098) from an older Dell XPS laptop, the [Core i7-4810MQ](https://www.techpowerup.com/cpu-specs/core-i7-4810mq.c1758) from an older Dell Precision laptop, and the ancient [Core 2 Duo E7400](https://www.techpowerup.com/cpu-specs/core-2-duo-e7400.c1532) desktop server.

## Problems

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Problem</th>
      <th>Difficulty</th>
      <th>Time</th>
    </tr>
  </thead>
  <tbody>
    <!--
      Difficulty bar color: hue = 120 - (difficulty - 5) * 1.26
        - HSL hue 120 = green, hue 0 = red
        - Difficulty ranges from 5% to 100%, so (difficulty - 5) gives 0 to 95
        - Multiplier 1.26 ≈ 120/95 maps this range to hue 120 (green) down to 0 (red)
    -->
    {% for problem in collections.euler %}
    <tr>
      <td>{{ problem.data.problem_number }}</td>
      <td><a href="{{ problem.url }}">{{ problem.data.problem_name }}</a></td>
      <td>{%- if problem.data.difficulty %}{% set hue = 120 - (problem.data.difficulty - 5) * 1.26 %}<div class="difficulty-bar" data-tooltip="Difficulty: {{ problem.data.difficulty }}%"><div class="difficulty-bar-fill{% if problem.data.difficulty == 100 %} difficulty-bar-fill--full{% endif %}" style="width: {{ problem.data.difficulty }}%; background: hsl({{ hue }}, 70%, 45%);"></div></div>{% else %}—{% endif -%}</td>
      <td>{%- if problem.data.benchmark_file and problem.data.benchmark_key %}{% benchmark problem.data.benchmark_file, problem.data.benchmark_key %}{% else %}—{% endif -%}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

## Bonus problems

<table>
  <thead>
    <tr>
      <th>Problem</th>
      <th>Difficulty</th>
      <th>Time</th>
    </tr>
  </thead>
  <tbody>
    {% for problem in collections.allEuler %}{% if problem.data.bonus_problem %}
    <tr>
      <td><a href="{{ problem.url }}">{{ problem.data.problem_name }}</a></td>
      <td>{%- if problem.data.difficulty %}{% set hue = 120 - (problem.data.difficulty - 5) * 1.26 %}<div class="difficulty-bar" data-tooltip="Difficulty: {{ problem.data.difficulty }}%"><div class="difficulty-bar-fill{% if problem.data.difficulty == 100 %} difficulty-bar-fill--full{% endif %}" style="width: {{ problem.data.difficulty }}%; background: hsl({{ hue }}, 70%, 45%);"></div></div>{% else %}—{% endif -%}</td>
      <td>{%- if problem.data.benchmark_file and problem.data.benchmark_key %}{% benchmark problem.data.benchmark_file, problem.data.benchmark_key %}{% else %}—{% endif -%}</td>
    </tr>
    {% endif %}{% endfor %}
  </tbody>
</table>
