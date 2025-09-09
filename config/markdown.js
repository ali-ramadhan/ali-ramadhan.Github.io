/**
 * Markdown Configuration for Eleventy
 * Custom markdown extensions and processors
 */

import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";

export function configureMarkdown(eleventyConfig) {
  // Configure markdown-it with custom extensions
  eleventyConfig.amendLibrary("md", (mdLib) => {
    // Footnotes plugin
    mdLib.use(markdownItFootnote);

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
