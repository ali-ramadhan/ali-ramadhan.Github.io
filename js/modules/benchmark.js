/**
 * Benchmark Display Module
 * Handles interactive benchmark tooltips and modals
 */

function parseAnsiToHtml(text) {
  // SGR foreground color codes to CSS class names. Codes 0 (reset), 1 (bold),
  // 22 (normal weight), and 39 (default foreground) are handled separately.
  const fgClasses = {
    30: "black",
    31: "red",
    32: "green",
    33: "yellow",
    34: "blue",
    35: "magenta",
    36: "cyan",
    37: "white",
    90: "gray",
  };

  let fg = null; // active foreground color class, or null for the default
  let bold = false; // whether bold is currently active
  let openSpans = 0; // number of <span> tags currently open

  const closeAll = () => {
    const closing = "</span>".repeat(openSpans);
    openSpans = 0;
    return closing;
  };

  const openActive = () => {
    let opening = "";
    if (bold) {
      opening += '<span class="ansi-bold">';
      openSpans++;
    }
    if (fg) {
      opening += `<span class="ansi-${fg}">`;
      openSpans++;
    }
    return opening;
  };

  // Replace ANSI escape codes with HTML spans. On each code we close the open
  // spans, update the state, then reopen spans for whatever attributes are
  // still active, which guarantees the emitted spans are always well nested.
  return (
    text.replace(/\[(\d+)m/g, (match, codeStr) => {
      const code = parseInt(codeStr, 10);

      // Leave codes we don't understand untouched (and don't disturb spans).
      if (code !== 0 && code !== 1 && code !== 22 && code !== 39 && !fgClasses[code]) {
        return match;
      }

      const closing = closeAll();
      if (code === 0) {
        // Full reset - clear all attributes.
        fg = null;
        bold = false;
      } else if (code === 1) {
        bold = true;
      } else if (code === 22) {
        // Normal weight - turn off bold only.
        bold = false;
      } else if (code === 39) {
        // Default foreground - clear the color only, leave bold alone.
        fg = null;
      } else {
        fg = fgClasses[code];
      }
      return closing + openActive();
    }) + closeAll()
  );
}

export class BenchmarkManager {
  constructor() {
    this.tooltip = null;
    this.activeReference = null;
    this.currentBenchmarkData = null;
    this.hoverTimeout = null;

    // Store bound handlers for cleanup
    this.boundHandleMouseEnter = this.handleMouseEnter.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);

    this.init();
  }

  init() {
    this.createTooltip();
    this.attachEventListeners();
  }

  createTooltip() {
    // Create tooltip element
    this.tooltip = document.createElement("div");
    this.tooltip.className = "benchmark-tooltip";
    this.tooltip.innerHTML = `
      <div class="benchmark-tooltip-content">
        <div class="benchmark-cpu-selector">
          <select class="benchmark-cpu-dropdown" aria-label="Select CPU"></select>
        </div>
        <div class="benchmark-meta"></div>
        <pre class="benchmark-output"></pre>
        <button class="benchmark-close" aria-label="Close benchmark details">&times;</button>
      </div>
    `;
    document.body.appendChild(this.tooltip);

    // Add click handler for close button
    this.tooltip.querySelector(".benchmark-close").addEventListener("click", () => {
      this.hideTooltip();
    });

    // Add change handler for CPU dropdown
    const dropdown = this.tooltip.querySelector(".benchmark-cpu-dropdown");
    dropdown.addEventListener("change", (e) => {
      if (this.currentBenchmarkData) {
        this.updateTooltipForCpu(e.target.value);
      }
    });

    // Add scroll wheel navigation for CPU dropdown
    dropdown.addEventListener("wheel", (e) => {
      e.preventDefault();
      const options = dropdown.options;
      if (options.length <= 1) return;

      const currentIndex = dropdown.selectedIndex;
      let newIndex;

      if (e.deltaY > 0) {
        // Scroll down - next option
        newIndex = Math.min(currentIndex + 1, options.length - 1);
      } else {
        // Scroll up - previous option
        newIndex = Math.max(currentIndex - 1, 0);
      }

      if (newIndex !== currentIndex) {
        dropdown.selectedIndex = newIndex;
        dropdown.dispatchEvent(new Event("change"));
      }
    });
  }

  attachEventListeners() {
    // Use event delegation for benchmark references
    document.addEventListener("mouseenter", this.boundHandleMouseEnter, true);
    document.addEventListener("mouseleave", this.boundHandleMouseLeave, true);
    document.addEventListener("click", this.boundHandleClick, true);
    document.addEventListener("keydown", this.boundHandleKeydown);
  }

  handleMouseEnter(e) {
    // Capture-phase delegation on document: when the pointer enters the page
    // itself, e.target is the document node, which has no classList.
    if (e.target instanceof Element && e.target.classList.contains("benchmark-reference")) {
      // Add slight delay before showing tooltip
      this.hoverTimeout = setTimeout(() => {
        this.showTooltip(e.target, e);
      }, 300);
    }
  }

  handleMouseLeave(e) {
    if (e.target instanceof Element && e.target.classList.contains("benchmark-reference")) {
      // Clear any pending hover timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }

      // Small delay to allow moving to tooltip
      setTimeout(() => {
        if (!this.tooltip.matches(":hover") && !e.target.matches(":hover")) {
          this.hideTooltip();
        }
      }, 100);
    }
  }

  handleClick(e) {
    if (e.target instanceof Element && e.target.classList.contains("benchmark-reference")) {
      e.preventDefault();
      // Clear any pending hover timeout to prevent race condition
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
      this.showTooltip(e.target, e);
    } else if (!this.tooltip.contains(e.target)) {
      // Click outside tooltip - hide it
      this.hideTooltip();
    }
  }

  handleKeydown(e) {
    if (e.key === "Escape") {
      this.hideTooltip();
    }
  }

  showTooltip(element, event) {
    try {
      const benchmarkData = JSON.parse(element.dataset.benchmark);
      this.currentBenchmarkData = benchmarkData;

      // Populate CPU dropdown, sorted by median time (fastest first)
      const dropdown = this.tooltip.querySelector(".benchmark-cpu-dropdown");
      dropdown.innerHTML = "";

      // Parse median time to numeric value for sorting
      const parseTime = (timeStr) => {
        const match = timeStr.match(/([\d.]+)\s*([nμm]?s)/);
        if (!match) return Infinity;
        const value = parseFloat(match[1]);
        const unit = match[2];
        // Convert to nanoseconds for comparison
        if (unit === "ns") return value;
        if (unit === "μs") return value * 1000;
        if (unit === "ms") return value * 1000000;
        if (unit === "s") return value * 1000000000;
        return value;
      };

      const cpuNames = Object.keys(benchmarkData.cpus).sort((a, b) => {
        const timeA = parseTime(benchmarkData.cpus[a].median_time);
        const timeB = parseTime(benchmarkData.cpus[b].median_time);
        return timeA - timeB;
      });

      const fastestTime = parseTime(benchmarkData.cpus[cpuNames[0]].median_time);

      cpuNames.forEach((cpuName, index) => {
        const cpuData = benchmarkData.cpus[cpuName];
        const rank = index + 1;
        const option = document.createElement("option");
        option.value = cpuName;

        let text = `${rank}. ${cpuName}`;

        // Show thread count if available (multi-threaded benchmark)
        if (cpuData.thread_count) {
          text += ` | ${cpuData.thread_count} threads`;
        }

        // Show slowdown for non-fastest CPUs
        if (rank > 1) {
          const cpuTime = parseTime(cpuData.median_time);
          const slowdown = (cpuTime / fastestTime).toFixed(2);
          text += ` | ${slowdown}× slower`;
        }

        option.textContent = text;
        dropdown.appendChild(option);
      });

      // Select the fastest CPU (first in sorted list)
      dropdown.value = cpuNames[0];

      // Update tooltip content for the fastest CPU
      this.updateTooltipForCpu(cpuNames[0]);

      // Show tooltip
      this.tooltip.classList.add("visible");
      this.activeReference = element;

      // Position tooltip
      this.positionTooltip(event || element);
    } catch (error) {
      console.error("Error displaying benchmark:", error);
    }
  }

  updateTooltipForCpu(cpuName) {
    if (!this.currentBenchmarkData || !this.currentBenchmarkData.cpus[cpuName]) {
      return;
    }

    const cpuData = this.currentBenchmarkData.cpus[cpuName];

    // Update metadata line (Julia version and OS)
    const meta = this.tooltip.querySelector(".benchmark-meta");
    meta.textContent = `${cpuData.julia_version} · ${cpuData.os}`;

    // Update tooltip content with colored ANSI output
    const output = this.tooltip.querySelector(".benchmark-output");
    output.innerHTML = parseAnsiToHtml(cpuData.full_output);
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove("visible");
      this.activeReference = null;
    }
  }

  positionTooltip(eventOrElement) {
    if (!this.tooltip) return;

    let x, y;

    if (eventOrElement.clientX !== undefined) {
      // Mouse event
      x = eventOrElement.clientX;
      y = eventOrElement.clientY;
    } else {
      // Element
      const rect = eventOrElement.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.bottom;
    }

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Adjust horizontal position
    if (x + tooltipRect.width / 2 > viewportWidth - 20) {
      x = viewportWidth - tooltipRect.width - 20;
    } else if (x - tooltipRect.width / 2 < 20) {
      x = 20;
    } else {
      x = x - tooltipRect.width / 2;
    }

    // Adjust vertical position
    if (y + tooltipRect.height > viewportHeight - 20) {
      // Show above instead of below
      if (eventOrElement.getBoundingClientRect) {
        y = eventOrElement.getBoundingClientRect().top - tooltipRect.height - 10;
      } else {
        y = y - tooltipRect.height - 20;
      }
    } else {
      y = y + 10;
    }

    // Apply position
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  cleanup() {
    // Remove document-level event listeners
    document.removeEventListener("mouseenter", this.boundHandleMouseEnter, true);
    document.removeEventListener("mouseleave", this.boundHandleMouseLeave, true);
    document.removeEventListener("click", this.boundHandleClick, true);
    document.removeEventListener("keydown", this.boundHandleKeydown);

    // Clear any pending timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    // Remove tooltip element
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
  }
}
