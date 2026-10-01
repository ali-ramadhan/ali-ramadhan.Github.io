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

const RATIO_FORMAT = new Intl.NumberFormat("en-US", {
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
});

// The same as formatRatio in config/benchmark-utils.js, for medians taken here
export function formatRatio(ratio) {
  return `${RATIO_FORMAT.format(ratio)}×`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// The kinds of processor ("cpu", "gpu") a reference's numbers ran on
function processorsOf(data) {
  return data.kind === "ratio"
    ? [...new Set([data.numerator_processor, data.denominator_processor])]
    : [data.processor];
}

// The kinds of processor picked on the page that apply to a reference, so
// picking a GPU leaves CPU numbers alone and the other way round. `selection`
// is `{ cpu, gpu }`, with null for no pick.
export function picksFor(data, selection) {
  return processorsOf(data).filter((processor) => selection[processor]);
}

// The pairs of a ratio on the CPU and GPU picked on the page
export function matchingPairs(ratio, selection) {
  return ratio.pairs.filter((pair) =>
    picksFor(ratio, selection).every((processor) => pair[processor] === selection[processor])
  );
}

/**
 * What a reference shows for the CPU and GPU picked on the page: a benchmark's
 * time (or memory estimate) on the pick of its kind, or a ratio's median over
 * the pairs left by the picks. With no pick that applies it shows its default,
 * and "n/a" when it never ran on what was picked.
 */
export function referenceText(data, selection) {
  if (picksFor(data, selection).length === 0) return data.default_text;

  if (data.kind === "ratio") {
    const pairs = matchingPairs(data, selection);
    if (pairs.length === 0) return "n/a";
    if (pairs.length === 1) return pairs[0].ratio_text;
    return formatRatio(median(pairs.map((pair) => pair.ratio)));
  }

  const run = data.devices[selection[data.processor]];
  if (!run) return "n/a";
  return data.display_type === "memory" ? run.memory_estimate : run.median_time;
}

// A ratio's pair in the dropdown: its CPU or GPU, or "CPU ÷ GPU" in the
// order of the ratio
export function pairLabel(ratio, pair) {
  const numerator = pair[ratio.numerator_processor];
  const denominator = pair[ratio.denominator_processor];
  return numerator === denominator ? numerator : `${numerator} ÷ ${denominator}`;
}

// What a ratio's pairs are called: CPUs, GPUs, or CPU–GPU pairs
function pairNoun(ratio, count) {
  if (ratio.numerator_processor !== ratio.denominator_processor) {
    return count === 1 ? "CPU–GPU pair" : "CPU–GPU pairs";
  }
  const name = ratio.numerator_processor.toUpperCase();
  return count === 1 ? name : `${name}s`;
}

// The line under the dropdown: the Julia version and OS, and for a GPU also the
// CPU it ran alongside and the CUDA software it used
export function runDetails(run) {
  if (!run.host_cpu) return `${run.julia_version} · ${run.os}`;
  return [
    `Host CPU: ${run.host_cpu}`,
    run.julia_version,
    `CUDA ${run.cuda_runtime}`,
    `CUDA.jl ${run.cuda_jl}`,
    `NVIDIA driver ${run.nvidia_driver}`,
    run.os,
  ].join(" · ");
}

export class BenchmarkManager {
  constructor() {
    this.tooltip = null;
    this.activeReference = null;
    this.currentBenchmarkData = null;
    this.hoverTimeout = null;

    // CPU and GPU picked in a tooltip. Every number on the page then shows the
    // pick of the kind of processor it ran on; null shows each one's default.
    this.pageSelection = { cpu: null, gpu: null };
    this.referenceCache = new WeakMap();

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
          <select class="benchmark-cpu-dropdown" aria-label="Select CPU or GPU"></select>
          <button class="benchmark-cpu-reset" type="button" hidden
            title="Show each number's default again: the fastest CPU or GPU for each benchmark and the median over all pairs for each ratio">Reset</button>
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

    // Picking a CPU or GPU, or a pair of them for a ratio, shows it for every
    // benchmark and ratio on the page
    const dropdown = this.tooltip.querySelector(".benchmark-cpu-dropdown");
    dropdown.addEventListener("change", (e) => {
      if (this.currentBenchmarkData) {
        this.selectOption(e.target.value);
      }
    });

    this.tooltip.querySelector(".benchmark-cpu-reset").addEventListener("click", () => {
      this.select({ cpu: null, gpu: null });
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
    // Use event delegation for benchmark references. Hovering is handled with
    // pointer events so it can be limited to a mouse: after a tap, browsers
    // send a mouseleave that would close the tooltip the tap just opened.
    document.addEventListener("pointerenter", this.boundHandleMouseEnter, true);
    document.addEventListener("pointerleave", this.boundHandleMouseLeave, true);
    document.addEventListener("click", this.boundHandleClick, true);
    document.addEventListener("keydown", this.boundHandleKeydown);
  }

  handleMouseEnter(e) {
    if (e.pointerType !== "mouse") return;

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
    if (e.pointerType !== "mouse") return;

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
      this.populateTooltip(element);

      // Show tooltip
      this.tooltip.classList.add("visible");
      this.activeReference = element;

      // Position tooltip
      this.positionTooltip(event || element);
    } catch (error) {
      console.error("Error displaying benchmark:", error);
    }
  }

  // Parsed data-benchmark of a reference, with the text it was built with kept
  // as its default
  referenceData(element) {
    let data = this.referenceCache.get(element);
    if (!data) {
      data = JSON.parse(element.dataset.benchmark);
      data.default_text = element.textContent;
      this.referenceCache.set(element, data);
    }
    return data;
  }

  // Fill in the tooltip for a reference, open on what the page picked if that
  // applies to it and on the reference's own default otherwise
  populateTooltip(element) {
    const data = this.referenceData(element);
    this.currentBenchmarkData = data;

    const dropdown = this.tooltip.querySelector(".benchmark-cpu-dropdown");
    dropdown.innerHTML = "";

    if (data.kind === "ratio") {
      this.populateRatioOptions(dropdown, data);
    } else {
      this.populateBenchmarkOptions(dropdown, data);
    }

    const { cpu, gpu } = this.pageSelection;
    this.tooltip.querySelector(".benchmark-cpu-reset").hidden = !cpu && !gpu;
  }

  // Pick the dropdown's CPU or GPU, or both of a ratio's pair, for the whole page
  selectOption(value) {
    const data = this.currentBenchmarkData;
    if (data.kind !== "ratio") {
      this.select({ [data.processor]: value });
      return;
    }

    // The scroll wheel can land on the disabled "not benchmarked" option, which isn't a pair
    const pair = data.pairs[Number(value)];
    if (!pair) return;

    const picks = {};
    for (const processor of ["cpu", "gpu"]) {
      if (processor in pair) picks[processor] = pair[processor];
    }
    this.select(picks);
  }

  // Change the page's picks, leaving any kind of processor not in `picks` alone
  select(picks) {
    this.pageSelection = { ...this.pageSelection, ...picks };
    this.updateReferences();
    if (this.activeReference) {
      this.populateTooltip(this.activeReference);
    }
  }

  updateReferences() {
    const fadeIn = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const element of document.querySelectorAll(".benchmark-reference")) {
      const data = this.referenceData(element);
      const text = referenceText(data, this.pageSelection);
      element.classList.toggle("benchmark-reference--missing", text === "n/a");

      if (element.textContent === text) continue;
      element.textContent = text;

      // Fade the new number in so changes elsewhere on the page get noticed
      if (fadeIn) {
        const opacity = getComputedStyle(element).opacity;
        element.animate([{ opacity: 0.2 }, { opacity }], { duration: 500, easing: "ease-out" });
      }
    }
  }

  // A disabled option for something the page picked that a reference never ran on
  missingOption(label, value) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${label} | not benchmarked`;
    option.disabled = true;
    return option;
  }

  // List the CPUs (or GPUs) by median time, fastest first, and open on the
  // page's pick, or on the fastest, whose time is the one shown inline
  populateBenchmarkOptions(dropdown, benchmarkData) {
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

    const devices = benchmarkData.devices;
    const names = Object.keys(devices).sort(
      (a, b) => parseTime(devices[a].median_time) - parseTime(devices[b].median_time)
    );

    const fastestTime = parseTime(devices[names[0]].median_time);

    names.forEach((name, index) => {
      const run = devices[name];
      const rank = index + 1;
      const option = document.createElement("option");
      option.value = name;

      let text = `${rank}. ${name}`;

      // Show thread count if available (multi-threaded benchmark)
      if (run.thread_count) {
        text += ` | ${run.thread_count} threads`;
      }

      // Show slowdown for all but the fastest
      if (rank > 1) {
        const slowdown = (parseTime(run.median_time) / fastestTime).toFixed(2);
        text += ` | ${slowdown}× slower`;
      }

      option.textContent = text;
      dropdown.appendChild(option);
    });

    dropdown.setAttribute(
      "aria-label",
      benchmarkData.processor === "gpu" ? "Select GPU" : "Select CPU"
    );

    let name = names[0];
    const picked = this.pageSelection[benchmarkData.processor];
    if (picked) {
      name = picked;
      if (!devices[picked]) {
        // Keep the page's pick in view even though this one never ran on it
        dropdown.prepend(this.missingOption(picked, picked));
      }
    }

    dropdown.value = name;
    this.showRun(benchmarkData, name);
  }

  // List the pairs by ratio, largest first, and open on the one the page's
  // picks leave, or on the one closest to the median shown inline
  populateRatioOptions(dropdown, ratio) {
    const order = ratio.pairs
      .map((pair, index) => index)
      .sort((a, b) => ratio.pairs[b].ratio - ratio.pairs[a].ratio);

    order.forEach((index, rank) => {
      const pair = ratio.pairs[index];
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${rank + 1}. ${pairLabel(ratio, pair)} | ${pair.ratio_text}`;
      dropdown.appendChild(option);
    });

    dropdown.setAttribute(
      "aria-label",
      ratio.numerator_processor === ratio.denominator_processor
        ? `Select ${ratio.numerator_processor.toUpperCase()}`
        : "Select CPU and GPU"
    );

    const picks = picksFor(ratio, this.pageSelection);
    const pairs = matchingPairs(ratio, this.pageSelection);
    if (pairs.length === 0) {
      // Keep the page's picks in view even though no pair ran on them
      const label = picks.map((processor) => this.pageSelection[processor]).join(" and ");
      dropdown.prepend(this.missingOption(label, "missing"));
      dropdown.value = "missing";
      this.showMissing(label);
      return;
    }

    const shown = median(pairs.map((pair) => pair.ratio));
    const closest = pairs.reduce((best, pair) =>
      Math.abs(pair.ratio - shown) < Math.abs(best.ratio - shown) ? pair : best
    );
    dropdown.value = String(ratio.pairs.indexOf(closest));
    this.showPair(ratio, closest);
  }

  // Both median times (or memory estimates) of a pair, their ratio, and the
  // spread over all pairs. The values of a CPU–GPU pair say what each ran on.
  ratioSummary(ratio, pair) {
    const width =
      Math.max(ratio.numerator_key.length, ratio.denominator_key.length, "ratio".length) + 2;
    const count = ratio.pairs.length;
    const noun = pairNoun(ratio, count);
    const crossed = ratio.numerator_processor !== ratio.denominator_processor;
    const on = (processor) => (crossed ? ` on ${pair[processor]}` : "");

    let spread;
    if (count === 1) {
      spread = `${ratio.median_text} on the only ${noun} benchmarked`;
    } else if (ratio.min_text === ratio.max_text) {
      spread = `${ratio.median_text} on all ${count} ${noun}`;
    } else {
      spread = `${ratio.median_text} median over ${count} ${noun} (${ratio.min_text} to ${ratio.max_text})`;
    }

    return [
      ratio.numerator_key.padEnd(width) + pair.numerator_value + on(ratio.numerator_processor),
      ratio.denominator_key.padEnd(width) +
        pair.denominator_value +
        on(ratio.denominator_processor),
      "ratio".padEnd(width) + pair.ratio_text,
      "",
      spread,
    ].join("\n");
  }

  // Show one run of a benchmark: its details and BenchmarkTools output
  showRun(benchmarkData, name) {
    const run = benchmarkData.devices[name];
    if (!run) {
      this.showMissing(name);
      return;
    }

    this.tooltip.querySelector(".benchmark-meta").textContent = runDetails(run);
    this.tooltip.querySelector(".benchmark-output").innerHTML = parseAnsiToHtml(run.full_output);
  }

  // Show one pair of a ratio
  showPair(ratio, pair) {
    this.tooltip.querySelector(".benchmark-meta").textContent =
      `${pair.julia_version} · ${pair.os}`;
    this.tooltip.querySelector(".benchmark-output").textContent = this.ratioSummary(ratio, pair);
  }

  showMissing(label) {
    this.tooltip.querySelector(".benchmark-meta").textContent = "";
    this.tooltip.querySelector(".benchmark-output").textContent = `Not benchmarked on ${label}`;
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
    document.removeEventListener("pointerenter", this.boundHandleMouseEnter, true);
    document.removeEventListener("pointerleave", this.boundHandleMouseLeave, true);
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
