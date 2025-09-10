import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import { configureMarkdown } from "./config/markdown.js";

export default function (eleventyConfig) {
  // Configure custom markdown extensions and transforms
  configureMarkdown(eleventyConfig);

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

  // Pass through assets - but let Vite handle CSS and JS processing
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("_data");
  eleventyConfig.addPassthroughCopy("CNAME");

  // Create a collection for blog posts
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("blog/posts/*.md").sort((a, b) => {
      return b.date - a.date; // Sort by date, newest first
    });
  });

  // Create a collection for Project Euler problems
  eleventyConfig.addCollection("euler", function (collectionApi) {
    return collectionApi.getFilteredByGlob("blog/project_euler/*.md").sort((a, b) => {
      // Sort by problem number (extracted from filename)
      const aNum = parseInt(a.fileSlug.match(/\d+/)?.[0] || "0");
      const bNum = parseInt(b.fileSlug.match(/\d+/)?.[0] || "0");
      return aNum - bNum;
    });
  });

  return {
    dir: {
      input: ".",
      output: "_site",
    },
    // Use Nunjucks for HTML files
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"],
  };
}
