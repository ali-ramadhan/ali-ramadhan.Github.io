/**
 * Markdown Configuration for Eleventy
 * Custom markdown extensions and processors
 */

import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";
import markdownItAnchor from "markdown-it-anchor";
import markdownItToc from "markdown-it-table-of-contents";
import markdownItPrism from "markdown-it-prism";
import { markdownItCitations, clearCitationCaches } from "./citations.js";
import { processBenchmark, processRatio, clearBenchmarkCache } from "./benchmark-utils.js";
import { processCode } from "./code-utils.js";

// Custom math blocks plugin for markdown-it
function markdownItMathBlocks(md) {
  const defaultFence =
    md.renderer.rules.fence ||
    function (tokens, idx, options, env, slf) {
      return slf.renderToken(tokens, idx, options);
    };

  md.renderer.rules.fence = function (tokens, idx, options, env, renderer) {
    const token = tokens[idx];
    if (token.info === "math") {
      // HTML-escape the math: the browser decodes the entities back to the
      // original characters before MathJax reads the text, but a raw "<"
      // glued to a letter would otherwise open a stray HTML tag
      const escaped = token.content
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return '<div class="math-display">$$' + escaped + "$$</div>\n";
    }
    return defaultFence(tokens, idx, options, env, renderer);
  };
}

// Custom benchmark plugin for markdown-it:
//   @benchmark[filename:key] or @benchmark[filename:key:display_type] shows one
//   benchmark's median time (or memory), and
//   @ratio[filename:key/key] or @ratio[filename:key/key:display_type] shows how
//   many times larger the first benchmark's median time (or memory) is
function markdownItBenchmark(md) {
  const shortcodeRegex = /@(benchmark|ratio)\[([^\]]+)\]/g;

  function renderBenchmark(reference) {
    const parts = reference.split(":");
    if (parts.length < 2 || parts.length > 3 || parts.some((part) => !part)) {
      throw new Error(`Expected "file:key" or "file:key:display_type", got "${reference}"`);
    }
    const [filename, key, displayType = "median_time"] = parts;
    return processBenchmark(filename, key, displayType);
  }

  // Swap each shortcode in a text token for its HTML, escaping the text around
  // it since the whole token becomes raw HTML. Returns null if there are none.
  function renderShortcodes(text) {
    let html = "";
    let last = 0;
    for (const match of text.matchAll(shortcodeRegex)) {
      const [fullMatch, name, reference] = match;
      let replacement;
      try {
        replacement = name === "ratio" ? processRatio(reference) : renderBenchmark(reference);
      } catch (error) {
        throw new Error(`${fullMatch}: ${error.message}`, { cause: error });
      }
      html += md.utils.escapeHtml(text.slice(last, match.index)) + replacement;
      last = match.index + fullMatch.length;
    }
    return last === 0 ? null : html + md.utils.escapeHtml(text.slice(last));
  }

  md.core.ruler.after("inline", "benchmark", function (state) {
    for (const token of state.tokens) {
      if (token.type !== "inline" || !token.children) continue;

      token.children = token.children.map((child) => {
        const html = child.type === "text" ? renderShortcodes(child.content) : null;
        if (html === null) return child;

        const htmlToken = new state.Token("html_inline", "", 0);
        htmlToken.content = html;
        htmlToken.level = child.level;
        return htmlToken;
      });
    }

    return false;
  });
}

// Custom code embedding plugin for markdown-it: a line of the form
// @code[problem-0012:find_first_triangle_with_divisors] becomes a fenced code
// block holding that definition from the pinned ProjectEulerSolutions.jl commit
function markdownItCode(md) {
  const codeRegex = /^@code\[([^\]]+)\]\s*$/;

  md.block.ruler.before(
    "fence",
    "code_embed",
    function (state, startLine, endLine, silent) {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      const match = codeRegex.exec(state.src.slice(start, state.eMarks[startLine]));
      if (!match) return false;
      if (silent) return true;

      const {
        code,
        language,
        sourcePath,
        startLine: from,
        endLine: to,
        url,
      } = processCode(match[1]);

      // Emit a regular fence token so Prism highlighting and its toolbar
      // plugins treat embedded code exactly like a hand-written block
      const token = state.push("fence", "code", 0);
      token.info = language;
      token.content = code + "\n";
      token.markup = "```";
      token.map = [startLine, startLine + 1];
      token.block = true;
      token.attrSet("data-source-path", from ? `${sourcePath}:${from}-${to}` : sourcePath);
      token.attrSet("data-source-url", url);

      state.line = startLine + 1;
      return true;
    },
    { alt: ["paragraph", "reference", "blockquote", "list"] }
  );
}

// Table row groups: a body row made only of dashes, like the delimiter row under
// the header, ends one group of rows and starts the next. Each group becomes its
// own <tbody>, and the table CSS draws a double line between groups.
//
//   | N    | Time |
//   | ---- | ---- |
//   | 10^6 | ...  |
//   | ---- | ---- |
//   | 10^9 | ...  |
function markdownItTableGroups(md) {
  const separatorCell = /^:?-{3,}:?$/;

  md.core.ruler.after("inline", "table_groups", function (state) {
    const tokens = state.tokens;
    let inBody = false;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === "tbody_open") inBody = true;
      if (tokens[i].type === "tbody_close") inBody = false;
      if (!inBody || tokens[i].type !== "tr_open") continue;

      let end = i + 1;
      let separator = true;
      while (tokens[end].type !== "tr_close") {
        if (tokens[end].type === "inline" && !separatorCell.test(tokens[end].content.trim())) {
          separator = false;
        }
        end++;
      }
      if (!separator) continue;

      // Swap the row for the end of this <tbody> and the start of the next
      const close = new state.Token("tbody_close", "tbody", -1);
      const open = new state.Token("tbody_open", "tbody", 1);
      close.block = open.block = true;
      tokens.splice(i, end - i + 1, close, open);
      i++;
    }
  });
}

export function configureMarkdown(eleventyConfig) {
  // The citation and benchmark plugins keep module-level caches; clear them
  // before every build so --serve rebuilds pick up reference YAML edits, drop
  // citations that were removed from posts, and re-read a re-pinned snapshot
  eleventyConfig.on("eleventy.before", () => {
    clearCitationCaches();
    clearBenchmarkCache();
  });

  // Configure markdown-it with custom extensions
  eleventyConfig.amendLibrary("md", (mdLib) => {
    // Custom math blocks plugin - must come before Prism plugin
    mdLib.use(markdownItMathBlocks);

    // Custom benchmark plugin - must come before other plugins
    mdLib.use(markdownItBenchmark);

    // Custom code embedding plugin - must come before the Prism plugin, which
    // renders the fence tokens it emits
    mdLib.use(markdownItCode);

    // Table row groups, split at body rows made only of dashes
    mdLib.use(markdownItTableGroups);

    // Citations plugin - must come before other plugins that might process links
    mdLib.use(markdownItCitations, {
      defaultReferenceFile: "time-series-zoo",
      citationClass: "citation",
      tooltipClass: "citation-tooltip",
    });

    // Footnotes plugin
    mdLib.use(markdownItFootnote);

    // Prism syntax highlighting plugin
    mdLib.use(markdownItPrism, {
      plugins: ["line-numbers", "toolbar", "show-language", "copy-to-clipboard"],
      init: (Prism) => {
        // Define empty math language to prevent warnings
        Prism.languages.math = {};
      },
    });

    // Anchor plugin - must come before TOC plugin
    mdLib.use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.headerLink({
        safariReaderFix: true,
      }),
    });

    // Table of contents plugin
    mdLib.use(markdownItToc, {
      includeLevel: [1, 2, 3],
      containerClass: "table-of-contents",
      markerPattern: /^\[\[toc\]\]/im,
      listType: "ul",
    });

    // Custom figure container syntax: ::: figure [classes]
    mdLib.use(markdownItContainer, "figure", {
      validate: function (params) {
        return params.trim().match(/^figure\s*(.*)$/);
      },
      render: function (tokens, idx) {
        const m = tokens[idx].info.trim().match(/^figure\s*(.*)$/);

        if (tokens[idx].nesting === 1) {
          // Opening tag - extract classes
          const classes = m[1] || "";
          return `<figure class="${classes}">\n`;
        } else {
          // Closing tag
          return "</figure>\n";
        }
      },
    });

    // HackerRank ProjectEuler+ note, placed under the quoted problem statement:
    // ::: hackerrank ... :::
    mdLib.use(markdownItContainer, "hackerrank", {
      render: function (tokens, idx) {
        return tokens[idx].nesting === 1 ? '<aside class="hackerrank-note">\n' : "</aside>\n";
      },
    });
  });

  // Post-process HTML transforms
  addHtmlTransforms(eleventyConfig);
}

function addHtmlTransforms(eleventyConfig) {
  // Convert paragraphs after images in figures to figcaptions
  eleventyConfig.addTransform("figcaption", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      // Replace patterns where a paragraph with image is followed by another paragraph in a figure
      content = content.replace(
        /<figure([^>]*)>\s*<p>(<img[^>]*>)<\/p>\s*<p>(.*?)<\/p>\s*<\/figure>/gs,
        "<figure$1>\n$2\n<figcaption>$3</figcaption>\n</figure>"
      );
    }
    return content;
  });
}
