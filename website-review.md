---
permalink: false
eleventyExcludeFromCollections: true
---

# Website review

Reviewed September 10, 2026. No source files were changed during the review.

Several reproducible bugs and content errors were found.

The main functional issues:

1. **Browser Back breaks homepage controls.** Open a blog post, then return using Back: when the browser restores the cached homepage, the theme button stops working. `pagehide` removes event handlers and stops slideshows, but there’s no restoration handler. Reproduced in Chromium. [earth-layers.js:22](js/earth-layers.js#L22)

2. **Arrow-key navigation gets stuck at Research.** At `/#ocean`, pressing ArrowDown repeatedly stays in place. The code chooses the closest section’s *center*, which misidentifies the current section when sections have very different heights. [navigation.js:68](js/modules/navigation.js#L68)

3. **The inline table of contents can navigate into invisible content.** Collapse “The copy statement,” then select “Parallel copy” from the article’s opening TOC: the page scrolls, but the target remains inside a collapsed section. Only the floating TOC implements ancestor expansion. [floating-toc.js:205](js/modules/floating-toc.js#L205)

4. **Some controls are inaccessible by keyboard.** The globe’s navigation arrows are unfocusable spans marked `aria-hidden="true"`. The floating TOC’s expansion controls are also unfocusable spans. These should be buttons with accessible names. [index.html:82](index.html#L82), [floating-toc.js:123](js/modules/floating-toc.js#L123)

5. **`hidden: true` still publishes the unfinished time-series post.** It removes the post from listings, but the production build includes `/blog/posts/time-series-zoo/` without `noindex`. If this is intended to be an unpublished draft, the current setting doesn’t accomplish that. [.eleventy.js:69](.eleventy.js#L69)

The weather-data article also has several concrete errors:

| Location | Issue |
|---|---|
| [Line 195](blog/posts/trillion-rows.md#L195) | `copy weather from some_big.csv …` needs quotes around `'some_big.csv'`; the example is invalid SQL as written. [PostgreSQL syntax](https://www.postgresql.org/docs/15/sql-copy.html). |
| [Line 127](blog/posts/trillion-rows.md#L127) | Hypertables **do support primary keys**, provided they include all partitioning columns. The stated reason for excluding SQLAlchemy’s ORM is incorrect. [Timescale documentation](https://d1ovb29l12vjqm.cloudfront.net/use-timescale/latest/schema-management/about-constraints/). |
| [Line 115](blog/posts/trillion-rows.md#L115) | MVCC doesn’t eliminate locking for writes. Inserts acquire table locks; updates and deletes also acquire row locks. [PostgreSQL locking documentation](https://www.postgresql.org/docs/15/explicit-locking.html). |
| [Line 205](blog/posts/trillion-rows.md#L205) and [line 249](blog/posts/trillion-rows.md#L249) | 1,038,240 rows represents **one hour**, not one day, given the grid size and hourly sampling described earlier. |

**One runnable Julia example fails:** `smallest_multiple(88)` throws an `OverflowError` with the implementation shown. Use `smallest_multiple(Int128(88))`; both calls were run and the latter produces the documented result. [problem-0005.md:39](blog/project-euler/problem-0005.md#L39)

Some straightforward typos:

- “the their end-caps” → “their end-caps.” [research.html:315](_includes/research.html#L315)
- “1840’s” → “1840s.” [research.html:417](_includes/research.html#L417)
- “Javascript” → “JavaScript,” in two places. [resources.html:141](_includes/resources.html#L141)
- “NvME” → “NVMe,” in three places. [trillion-rows.md:311](blog/posts/trillion-rows.md#L311)
- “exampels” → “examples.” [time-series-zoo.md:29](blog/posts/time-series-zoo.md#L29)
- “unpredictibility” → “unpredictability.” [time-series-zoo.md:101](blog/posts/time-series-zoo.md#L101)

The production build and JavaScript/CSS lint checks pass. Local file and anchor checks across all 44 generated HTML pages found no broken targets. Prettier’s check reports formatting differences in 68 files.
