/**
 * Markdown Configuration for Eleventy
 * Custom markdown extensions and processors
 */

import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";
import markdownItAnchor from "markdown-it-anchor";
import markdownItToc from "markdown-it-table-of-contents";
import markdownItPrism from "markdown-it-prism";
import { markdownItCitations } from "./citations.js";
import { readFileSync } from "fs";
import path from "path";
import yaml from "js-yaml";

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
      return '<div class="math-display">$$' + token.content.trim() + "$$</div>\n";
    }
    return defaultFence(tokens, idx, options, env, renderer);
  };
}

// Custom benchmark plugin for markdown-it
function markdownItBenchmark(md) {
  // Regex to match @benchmark[filename:key] pattern
  const benchmarkRegex = /@benchmark\[([^:]+):([^\]]+)\]/g;

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
              const [fullMatch, filename, key] = match;

              try {
                // Load benchmark data from YAML
                const benchmarkPath = path.join(
                  process.cwd(),
                  "_data",
                  "project-euler",
                  "benchmarks",
                  `${filename}.yaml`
                );
                const benchmarkData = yaml.load(readFileSync(benchmarkPath, "utf8"));
                const benchmark = benchmarkData[key];

                if (benchmark && benchmark.output) {
                  // Extract median time from the benchmark output (accounting for ANSI codes)
                  const medianMatch = benchmark.output.match(/median[^:]*:.*?([\d.]+\s+[nμm]?s)/);
                  const medianTime = medianMatch ? medianMatch[1] : "Unknown";

                  // Create benchmark data object with extracted median time
                  const benchmarkObj = {
                    median_time: medianTime,
                    full_output: benchmark.output,
                    julia_version: benchmark.julia_version,
                    cpu: benchmark.cpu,
                    os: benchmark.os,
                  };

                  // Replace with HTML for interactive benchmark display
                  const escapedData = JSON.stringify(benchmarkObj).replace(/'/g, "&#39;");
                  const replacement = `<span class="benchmark-reference" data-benchmark='${escapedData}'>${medianTime}</span>`;
                  content = content.replace(fullMatch, replacement);
                } else {
                  console.warn(`Benchmark key "${key}" not found in ${filename}.yaml`);
                  content = content.replace(fullMatch, `[Benchmark ${filename}:${key} not found]`);
                }
              } catch (error) {
                console.warn(`Error loading benchmark file ${filename}.yaml:`, error.message);
                content = content.replace(fullMatch, `[Benchmark file ${filename}.yaml not found]`);
              }
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

export function configureMarkdown(eleventyConfig) {
  // Configure markdown-it with custom extensions
  eleventyConfig.amendLibrary("md", (mdLib) => {
    // Custom math blocks plugin - must come before Prism plugin
    mdLib.use(markdownItMathBlocks);

    // Custom benchmark plugin - must come before other plugins
    mdLib.use(markdownItBenchmark);

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
