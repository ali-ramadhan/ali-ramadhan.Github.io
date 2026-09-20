# [aliramadhan.me](https://aliramadhan.me/)

My [personal website](https://aliramadhan.me/) hosted on GitHub.

## Project Euler posts

The posts under `blog/project-euler/` embed code and benchmark data straight
from [ProjectEulerSolutions.jl](https://github.com/ali-ramadhan/ProjectEulerSolutions.jl)
so there is a single source of truth. `pe-solutions.json` pins the exact commit
the site builds against; the build shallow-fetches that commit into
`.cache/pe-solutions/<sha>/` the first time it is needed and reads plain files
from there afterwards. Nothing is copied into this repository.

To build against newer solutions or benchmarks, push them to
ProjectEulerSolutions.jl first, then move the pin and commit the result:

```
npm run pe:bump            # pin the tip of the default branch
npm run pe:bump -- <ref>   # pin a branch, tag, or full commit SHA
```

### Embedding code

A line of the form `@code[file:selectors]` becomes a fenced code block with a
"View on GitHub" permalink to the pinned commit. `file` is a problem slug
(`problem-0012`, `bonus-18i`) or a path relative to the repository root, and
`selectors` is a comma-separated list of top-level definition names, imports
(`using Combinatorics`), or line ranges. Docstrings and comments above a
definition are not included.

```
@code[problem-0012:find_first_triangle_with_divisors]
@code[problem-0014:collatz_length,longest_collatz_under]
@code[problem-0033:using Combinatorics,multiply_curious_fractions]
@code[src/utils/Divisors.jl:num_divisors]
@code[problem-0012:14-36]
@code[problem-0024]
```

Prefer names over line ranges: a name either resolves or fails the build,
whereas a line range silently goes stale when the file changes above it.

### Embedding benchmarks

`@benchmark[slug:name]` renders the fastest median time recorded for that
benchmark in `benchmarks/benchmark_data/<slug>-benchmarks.yaml`, with the
per-CPU results available on hover; `@benchmark[slug:name:memory]` shows the
memory estimate instead. The `{% benchmark %}` shortcode does the same in
templates.

Every `@code` and `@benchmark` reference must resolve against the pinned
commit; one that does not fails the build with the file, the reference, and
what is available.
