---
title: "Project Euler Solutions"
date: 2024-09-09
layout: "blog-post"
---

# Project Euler Solutions

Blurb.

<div class="euler-problems">
{% for problem in collections.euler %}
  <div class="euler-problem">
    <h3><a href="{{ problem.url }}">{{ problem.data.title }}</a></h3>
  </div>
{% endfor %}
</div>

## About Project Euler

[Project Euler](https://projecteuler.net/) combines mathematical problem solving with computer programming. The problems range from simple arithmetic to advanced number theory, combinatorics, and computational mathematics.

## Navigation

- [Back to Blog](/blog/)
- [Visit Project Euler](https://projecteuler.net/)
