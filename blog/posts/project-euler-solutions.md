---
layout: "blog-post"
title: "Project Euler Notes"
---

[Project Euler](https://projecteuler.net/) combines mathematical problem solving with computer programming. The problems range from simple arithmetic to advanced number theory, combinatorics, and computational mathematics.

<div class="euler-problems">
{% for problem in collections.euler %}
  <div class="euler-problem">
    <h2><a href="{{ problem.url }}">{{ problem.data.title }}</a></h2>
  </div>
{% endfor %}
</div>
