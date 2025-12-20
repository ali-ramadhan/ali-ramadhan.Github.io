import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import { configureMarkdown } from "./config/markdown.js";
import { processBenchmark } from "./config/benchmark-utils.js";

export default function (eleventyConfig) {
  // Configure custom markdown extensions and transforms
  configureMarkdown(eleventyConfig);

  // Add date filter to format dates as YYYY-MM-DD
  eleventyConfig.addFilter("dateDisplay", function (dateObj) {
    if (!dateObj) return "";
    const date = new Date(dateObj);
    return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
  });

  // Add padStart filter for zero-padding numbers
  eleventyConfig.addFilter("padStart", function (num, length, char) {
    char = char || "0";
    return String(num).padStart(length, char);
  });

  // Add benchmark shortcode for use in templates
  eleventyConfig.addShortcode("benchmark", function (filename, key, displayType = "median_time") {
    return processBenchmark(filename, key, displayType);
  });

  // Add Vite plugin
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: {
      clearScreen: false,
      appType: "mpa",
      server: {
        middlewareMode: true,
      },
    },
  });

  // Pass through files for Vite to process
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("css");

  // Pass through root-level files needed for GitHub Pages and SEO
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("robots.txt");

  // Create a collection for blog posts
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("blog/posts/*.md")
      .filter(post => !post.data.hidden)
      .sort((a, b) => {
        return b.date - a.date; // Sort by date, newest first
      });
  });

  // Create a collection for Project Euler problems
  eleventyConfig.addCollection("euler", function (collectionApi) {
    return collectionApi.getFilteredByGlob("blog/project-euler/problem-*.md")
      .filter(problem => !problem.data.hidden)
      .sort((a, b) => {
        // Sort by problem number (extracted from filename)
        const aNum = parseInt(a.fileSlug.match(/\d+/)?.[0] || "0");
        const bNum = parseInt(b.fileSlug.match(/\d+/)?.[0] || "0");
        return aNum - bNum;
      });
  });

  // Create a combined collection for navigation (regular + bonus problems)
  eleventyConfig.addCollection("allEuler", function (collectionApi) {
    const regular = collectionApi.getFilteredByGlob("blog/project-euler/problem-*.md")
      .filter(p => !p.data.hidden)
      .sort((a, b) => {
        const aNum = parseInt(a.fileSlug.match(/\d+/)?.[0] || "0");
        const bNum = parseInt(b.fileSlug.match(/\d+/)?.[0] || "0");
        return aNum - bNum;
      });

    const bonus = collectionApi.getFilteredByGlob("blog/project-euler/bonus-*.md")
      .filter(p => !p.data.hidden)
      .sort((a, b) => {
        const aNum = a.data.bonus_problem_number || 0;
        const bNum = b.data.bonus_problem_number || 0;
        return aNum - bNum;
      });

    return [...regular, ...bonus];
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
    },
    // Use Nunjucks for HTML files
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"],
  };
}
