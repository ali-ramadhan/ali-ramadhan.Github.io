/**
 * MathJax Configuration and Initialization
 * Handles mathematical equation rendering in blog posts
 */

export class MathJaxManager {
  constructor() {
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      // Configure MathJax before loading
      window.MathJax = {
        tex: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
          displayMath: [
            ["$$", "$$"],
            ["\\[", "\\]"],
          ],
          processEscapes: true,
          processEnvironments: true,
          packages: ["base", "ams", "newcommand", "configmacros"],
        },
        startup: {
          ready: () => {
            console.log("📐 MathJax initialized successfully!");
            MathJax.startup.defaultReady();
            this.initialized = true;
            this.processMathCodeBlocks();
            this.reprocessMath();
          },
        },
      };

      // Load MathJax from CDN
      await this.loadMathJaxScript();
    } catch (error) {
      console.error("Failed to initialize MathJax:", error);
    }
  }

  loadMathJaxScript() {
    return new Promise((resolve, reject) => {
      // Check if MathJax is already loaded
      if (window.MathJax && window.MathJax.typesetPromise) {
        this.initialized = true;
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.id = "MathJax-script";
      script.async = true;
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js";

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error("Failed to load MathJax script"));
      };

      document.head.appendChild(script);
    });
  }

  // Convert ```math code blocks to MathJax display math
  processMathCodeBlocks() {
    const codeBlocks = document.querySelectorAll("pre code.language-math");
    codeBlocks.forEach((block) => {
      const mathContent = block.textContent;
      const mathDiv = document.createElement("div");
      mathDiv.innerHTML = `$$${mathContent}$$`;
      block.parentNode.parentNode.replaceChild(mathDiv, block.parentNode);
    });
  }

  // Method to re-process math if content is dynamically added
  reprocessMath() {
    if (this.initialized && window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise().catch((err) => {
        console.error("MathJax typeset error:", err);
      });
    }
  }
}
