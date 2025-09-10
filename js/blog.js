/**
 * Blog Entry
 * Loads fonts and blog-specific CSS, and minimal JS modules
 */

import "/css/fonts.css";
import "/css/base.css";
import "/css/blog.css";
import "/css/components/ui-controls.css";
import "/css/components/benchmark.css";

import { ThemeManager } from "./modules/theme.js";
import { MathJaxManager } from "./modules/mathjax.js";
import { BenchmarkManager } from "./modules/benchmark.js";

// Import Prism.js core and components
import Prism from "prismjs";
// Import languages needed for blog posts
import "prismjs/components/prism-sql";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
// Import Prism plugins
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/plugins/toolbar/prism-toolbar";
import "prismjs/plugins/show-language/prism-show-language";
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard";

// Import Prism theme (One Dark theme that works well with both light and dark modes)
import "prism-themes/themes/prism-one-dark.css";
// Import plugin CSS
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/toolbar/prism-toolbar.css";

// Initialize minimal functionality for blog pages
new ThemeManager();
new MathJaxManager();
new BenchmarkManager();

// Initialize Prism manually to ensure plugins work
document.addEventListener("DOMContentLoaded", () => {
  if (typeof Prism !== "undefined") {
    Prism.highlightAll();
  }
});

console.log("📝 Blog loaded with Vite!");
