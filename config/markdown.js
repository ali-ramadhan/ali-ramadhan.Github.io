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
import { processBenchmark, clearBenchmarkCache } from "./benchmark-utils.js";
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

// Custom benchmark plugin for markdown-it
function markdownItBenchmark(md) {
  // Regex to match @benchmark[filename:key] or @benchmark[filename:key:display_type] pattern
  const benchmarkRegex = /@benchmark\[([^:]+):([^:\]]+)(?::([^\]]+))?\]/g;

  md.core.ruler.after("inline", "benchmark", function (state) {
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];

      if (token.type === "inline" && token.children) {
        for (let j = 0; j < token.children.length; j++) {
          const child = token.children[j];

          if (child.type === "text" && benchmarkRegex.test(child.content)) {
            benchmarkRegex.lastIndex = 0; // Reset regex
            let match;
            let content = child.content;
            let hasMatches = false;

            while ((match = benchmarkRegex.exec(child.content)) !== null) {
              hasMatches = true;
              const [fullMatch, filename, key, displayType = "median_time"] = match;
              let replacement;
              try {
                replacement = processBenchmark(filename, key, displayType);
              } catch (error) {
                throw new Error(`${fullMatch}: ${error.message}`, { cause: error });
              }
              content = content.replace(fullMatch, replacement);
            }

            if (hasMatches) {
              // Create new HTML inline token
              const htmlToken = new state.Token("html_inline", "", 0);
              htmlToken.content = content;
              htmlToken.level = child.level;

              // Replace the text token with HTML token
              token.children[j] = htmlToken;

              // Reset regex for safety
              benchmarkRegex.lastIndex = 0;
            }
          }
        }
      }
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
