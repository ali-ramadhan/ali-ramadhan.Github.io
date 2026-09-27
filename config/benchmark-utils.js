/**
 * Benchmark Utilities
 * Shared functions for processing benchmark data in Node.js context
 */

import yaml from "js-yaml";
import { readSolutionsFile } from "./pe-solutions.js";

// What each display type shows, as extracted by loadBenchmarkData
const DISPLAY_TYPES = {
  median_time: { field: "median_time", parse: parseTime, noun: "median time" },
  memory: { field: "memory_estimate", parse: parseMemory, noun: "memory estimate" },
};

function displayTypeFor(displayType, label) {
  if (!Object.hasOwn(DISPLAY_TYPES, displayType)) {
    throw new Error(
      `Unknown benchmark display type "${displayType}" for "${label}"; expected one of ${Object.keys(DISPLAY_TYPES).join(", ")}`
    );
  }
  return DISPLAY_TYPES[displayType];
}

// Parsed benchmark files, keyed by slug; cleared before every build
const benchmarkFiles = new Map();

export function clearBenchmarkCache() {
  benchmarkFiles.clear();
}

/**
 * Parse time string to nanoseconds for comparison
 */
export function parseTime(timeStr) {
  const match = timeStr.match(/([\d.]+)\s*([nμm]?s)/);
  if (!match) return Infinity;
  const value = parseFloat(match[1]);
  const unit = match[2];
  if (unit === "ns") return value;
  if (unit === "μs") return value * 1000;
  if (unit === "ms") return value * 1000000;
  if (unit === "s") return value * 1000000000;
  return Infinity;
}

/**
 * Parse memory string to bytes for comparison
 */
export function parseMemory(memStr) {
  const match = memStr.match(/([\d.]+)\s*(bytes|[KMG]iB|[KMG]B)/i);
  if (!match) return Infinity;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "bytes") return value;
  if (unit === "kib" || unit === "kb") return value * 1024;
  if (unit === "mib" || unit === "mb") return value * 1024 * 1024;
  if (unit === "gib" || unit === "gb") return value * 1024 * 1024 * 1024;
  return Infinity;
}

/**
 * Load a problem's benchmark file (`benchmarks/benchmark_data/<slug>-benchmarks.yaml`
 * in ProjectEulerSolutions.jl) from the pinned snapshot
 */
function loadBenchmarkFile(slug) {
  if (!benchmarkFiles.has(slug)) {
    const relativePath = `benchmarks/benchmark_data/${slug}-benchmarks.yaml`;
    let data;
    try {
      data = yaml.load(readSolutionsFile(relativePath));
    } catch (error) {
      throw new Error(`No benchmark data for "${slug}": ${error.message}`, { cause: error });
    }
    if (!data || typeof data !== "object") {
      throw new Error(`No benchmark data for "${slug}": ${relativePath} is empty`);
    }
    benchmarkFiles.set(slug, data);
  }
  return benchmarkFiles.get(slug);
}

/**
 * Load and process benchmark data for one benchmark of a problem.
 * A missing file, key, or CPU results is a build error.
 */
export function loadBenchmarkData(slug, key) {
  const fileData = loadBenchmarkFile(slug);
  const cpuBenchmarks = fileData[key];

  if (!cpuBenchmarks || typeof cpuBenchmarks !== "object") {
    throw new Error(
      `No benchmark "${key}" for "${slug}". Available: ${Object.keys(fileData).join(", ")}`
    );
  }

  // Build cpus object with all CPU data
  const cpus = {};
  for (const [cpuName, benchmark] of Object.entries(cpuBenchmarks)) {
    if (benchmark && benchmark.output) {
      const medianMatch = benchmark.output.match(/median[^:]*:.*?([\d.]+\s+[nμm]?s)/);
      const medianTime = medianMatch ? medianMatch[1] : "Unknown";
      const memoryMatch = benchmark.output.match(
        /Memory estimate[^:]*:.*?([\d.]+\s*(?:bytes|[KMG]iB|[KMG]B))/i
      );
      const memoryEstimate = memoryMatch ? memoryMatch[1] : "Unknown";

      cpus[cpuName] = {
        median_time: medianTime,
        memory_estimate: memoryEstimate,
        full_output: benchmark.output,
        julia_version: benchmark.julia_version,
        os: benchmark.os,
        date: benchmark.date,
        thread_count: benchmark.thread_count,
      };
    }
  }

  if (Object.keys(cpus).length === 0) {
    throw new Error(`Benchmark "${key}" for "${slug}" has no results with output`);
  }

  return cpus;
}

/**
 * Inline reference whose data the tooltip in js/modules/benchmark.js displays
 */
function referenceSpan(className, data, text) {
  const escapedData = JSON.stringify(data).replace(/'/g, "&#39;");
  return `<span class="${className}" data-benchmark='${escapedData}'>${text}</span>`;
}

/**
 * Process benchmark and return HTML span element
 */
export function processBenchmark(slug, key, displayType = "median_time") {
  const { field, parse } = displayTypeFor(displayType, `${slug}:${key}`);
  const cpus = loadBenchmarkData(slug, key);

  // Find best CPU based on display type
  const bestCpu = Object.keys(cpus).reduce((best, cpu) =>
    parse(cpus[cpu][field]) < parse(cpus[best][field]) ? cpu : best
  );

  const displayValue = cpus[bestCpu]?.[field] || "Unknown";

  const cssModifier = displayType === "memory" ? " benchmark-reference--memory" : "";

  const benchmarkObj = {
    cpus: cpus,
    default_cpu: bestCpu,
    default_value: displayValue,
  };

  return referenceSpan(`benchmark-reference${cssModifier}`, benchmarkObj, displayValue);
}

/**
 * Parse the inside of @ratio[problem-0001:two_generator/two_inclusion_exclusion]
 * or @ratio[problem-0010:big_key/small_key:memory]: a benchmark file, two keys
 * separated by a slash, and optionally a display type (median_time by default)
 */
export function parseRatioReference(reference) {
  const match = reference.match(/^([^:/]+):([^:/]+)\/([^:/]+)(?::([^:/]+))?$/);
  if (!match) {
    throw new Error(`Expected "file:key/key" or "file:key/key:display_type", got "${reference}"`);
  }
  const [, slug, numeratorKey, denominatorKey, displayType = "median_time"] = match;
  if (numeratorKey === denominatorKey) {
    throw new Error(`"${numeratorKey}" is compared with itself`);
  }
  displayTypeFor(displayType, `${slug}:${numeratorKey}/${denominatorKey}`);
  return { slug, numeratorKey, denominatorKey, displayType };
}

const RATIO_FORMAT = new Intl.NumberFormat("en-US", {
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
});

/**
 * Format a ratio to three significant figures: 2366.5 → "2,370×", 1.624 → "1.62×"
 */
export function formatRatio(ratio) {
  return `${RATIO_FORMAT.format(ratio)}×`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// The two runs on a CPU should share a Julia version and OS; show both if not
function sameOrBoth(a, b) {
  return a === b ? a : `${a} / ${b}`;
}

/**
 * Ratio of one benchmark's median time (or memory estimate) to another's on
 * every CPU that ran both, summarized by the median over those CPUs.
 * `numerator` and `denominator` are `{ label, cpus }` with `cpus` as returned by
 * loadBenchmarkData. The larger one goes first, so the ratio reads as "N×
 * faster", "N× slower", "N× more", or "N× less" and a reference can't be written
 * the wrong way round: a median below 1× is an error.
 */
export function computeRatio(numerator, denominator, displayType = "median_time") {
  const { field, parse, noun } = displayTypeFor(
    displayType,
    `${numerator.label}/${denominator.label}`
  );

  const cpus = {};
  for (const [cpuName, numeratorRun] of Object.entries(numerator.cpus)) {
    const denominatorRun = denominator.cpus[cpuName];
    if (!denominatorRun) continue;

    const top = numeratorRun[field];
    const bottom = denominatorRun[field];
    const topValue = parse(top);
    const bottomValue = parse(bottom);
    if (!Number.isFinite(topValue) || !Number.isFinite(bottomValue)) {
      throw new Error(`Can't divide "${top}" by "${bottom}" on ${cpuName}`);
    }
    if (bottomValue <= 0) {
      throw new Error(
        `${denominator.label} is ${bottom} on ${cpuName}, so there's no ratio; show both with @benchmark instead`
      );
    }

    const ratio = topValue / bottomValue;
    cpus[cpuName] = {
      ratio,
      ratio_text: formatRatio(ratio),
      numerator_value: top,
      denominator_value: bottom,
      julia_version: sameOrBoth(numeratorRun.julia_version, denominatorRun.julia_version),
      os: sameOrBoth(numeratorRun.os, denominatorRun.os),
    };
  }

  const ratios = Object.values(cpus).map((cpu) => cpu.ratio);
  if (ratios.length === 0) {
    throw new Error(
      `${numerator.label} and ${denominator.label} were not benchmarked on any of the same CPUs`
    );
  }

  const medianRatio = median(ratios);
  if (medianRatio < 1) {
    throw new Error(
      `${denominator.label} has a larger ${noun} than ${numerator.label} (median ratio ` +
        `${formatRatio(medianRatio)} over ${ratios.length} CPUs); put the larger one first`
    );
  }

  return {
    cpus,
    median: medianRatio,
    min: Math.min(...ratios),
    max: Math.max(...ratios),
  };
}

/**
 * Process @ratio[file:key/key] or @ratio[file:key/key:display_type] and return
 * an HTML span showing how many times larger the first benchmark's median time
 * (or memory estimate) is than the second's. The ratio is taken per CPU, so it
 * never mixes machines, and the median over CPUs is shown.
 */
export function processRatio(reference) {
  const { slug, numeratorKey, denominatorKey, displayType } = parseRatioReference(reference);
  const ratio = computeRatio(
    { label: `${slug}:${numeratorKey}`, cpus: loadBenchmarkData(slug, numeratorKey) },
    { label: `${slug}:${denominatorKey}`, cpus: loadBenchmarkData(slug, denominatorKey) },
    displayType
  );

  const ratioObj = {
    kind: "ratio",
    display_type: displayType,
    numerator_key: numeratorKey,
    denominator_key: denominatorKey,
    cpus: ratio.cpus,
    median: ratio.median,
    median_text: formatRatio(ratio.median),
    min_text: formatRatio(ratio.min),
    max_text: formatRatio(ratio.max),
  };

  return referenceSpan(
    "benchmark-reference benchmark-reference--ratio",
    ratioObj,
    ratioObj.median_text
  );
}
