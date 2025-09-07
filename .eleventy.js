export default function (eleventyConfig) {
  // Pass through assets as-is
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy(".htaccess");

  // Watch CSS and JS for changes during development
  eleventyConfig.addWatchTarget("css/");
  eleventyConfig.addWatchTarget("js/");

  // Create a collection for blog posts
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("blog/posts/*.md").sort((a, b) => {
      return b.date - a.date; // Sort by date, newest first
    });
  });

  // Add date formatting filter
  eleventyConfig.addFilter("dateFormat", function(date) {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return date; // Return original if invalid
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  });

  // Add excerpt filter
  eleventyConfig.addFilter("excerpt", function(content, limit = 200) {
    if (!content) return "";
    const text = content.replace(/<[^>]*>/g, ""); // Strip HTML tags
    return text.length > limit ? text.substring(0, limit) + "..." : text;
  });

  return {
    dir: {
      input: ".",
      output: "_site",
    },
    // Use Nunjucks for HTML files
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"]
  };
}
