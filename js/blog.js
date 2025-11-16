/**
 * Blog Entry
 * Loads minimal JS modules for blog functionality
 */

import { ThemeManager } from "./modules/theme.js";
import { MathJaxManager } from "./modules/mathjax.js";
import { BenchmarkManager } from "./modules/benchmark.js";
import { CollapsibleHeadersManager } from "./modules/collapsible-headers.js";
import { FloatingTocManager } from "./modules/floating-toc.js";
import { CitationManager } from "./modules/citations.js";

// Import Prism.js core and components
import Prism from "prismjs";

// Import languages needed for blog posts
import "prismjs/components/prism-python";
import "prismjs/components/prism-julia";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";

// Import Prism plugins
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/plugins/toolbar/prism-toolbar";
import "prismjs/plugins/show-language/prism-show-language";
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard";

// Import Prism CSS (Vite will bundle these)
import "prism-themes/themes/prism-one-dark.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/toolbar/prism-toolbar.css";

// Initialize minimal functionality for blog pages
new ThemeManager();
new MathJaxManager();
new BenchmarkManager();
new CollapsibleHeadersManager();
new FloatingTocManager();
new CitationManager();

// Initialize Prism manually to ensure plugins work
document.addEventListener("DOMContentLoaded", () => {
  if (typeof Prism !== "undefined") {
    Prism.highlightAll();
  }
});
