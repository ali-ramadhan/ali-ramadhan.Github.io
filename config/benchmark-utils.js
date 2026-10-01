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
 * The runs of one benchmark from its YAML entries, which map the name of the
 * CPU or GPU each run was on to its details: the kind of processor it ran on
 * ("cpu" or "gpu") and each run's median time, memory estimate and details,
 * keyed by that name. GPU runs are the ones with a `host_cpu`. A benchmark
 * with no runs, or with runs on both kinds of processor, is a build error.
 */
export function benchmarkRuns(entries, slug, key) {
  const devices = {};
  for (const [name, benchmark] of Object.entries(entries)) {
    if (benchmark && benchmark.output) {
      const medianMatch = benchmark.output.match(/median[^:]*:.*?([\d.]+\s+[nμm]?s)/);
      const medianTime = medianMatch ? medianMatch[1] : "Unknown";
      const memoryMatch = benchmark.output.match(
        /Memory estimate[^:]*:.*?([\d.]+\s*(?:bytes|[KMG]iB|[KMG]B))/i
      );
      const memoryEstimate = memoryMatch ? memoryMatch[1] : "Unknown";

      devices[name] = {
        median_time: medianTime,
        memory_estimate: memoryEstimate,
        full_output: benchmark.output,
        julia_version: benchmark.julia_version,
        os: benchmark.os,
        date: benchmark.date,
        thread_count: benchmark.thread_count,
        host_cpu: benchmark.host_cpu,
        cuda_runtime: benchmark.cuda_runtime,
        cuda_jl: benchmark.cuda_jl,
        nvidia_driver: benchmark.nvidia_driver,
      };
    }
  }

  const names = Object.keys(devices);
  if (names.length === 0) {
    throw new Error(`Benchmark "${key}" for "${slug}" has no results with output`);
  }

  const gpuCount = names.filter((name) => devices[name].host_cpu).length;
  if (gpuCount > 0 && gpuCount < names.length) {
    throw new Error(
      `Benchmark "${key}" for "${slug}" has results on both CPUs and GPUs; save them under different names`
    );
  }

  return { processor: gpuCount > 0 ? "gpu" : "cpu", devices };
}

/**
 * Load and process benchmark data for one benchmark of a problem, as
 * benchmarkRuns returns it. A missing file or key is a build error.
 */
export function loadBenchmarkData(slug, key) {
  const fileData = loadBenchmarkFile(slug);
  const entries = fileData[key];

  if (!entries || typeof entries !== "object") {
    throw new Error(
      `No benchmark "${key}" for "${slug}". Available: ${Object.keys(fileData).join(", ")}`
    );
  }

  return benchmarkRuns(entries, slug, key);
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
  const { processor, devices } = loadBenchmarkData(slug, key);

  // Show the fastest CPU or GPU (or the smallest memory estimate)
  const best = Object.keys(devices).reduce((best, name) =>
    parse(devices[name][field]) < parse(devices[best][field]) ? name : best
  );

  const displayValue = devices[best]?.[field] || "Unknown";

  const cssModifier = displayType === "memory" ? " benchmark-reference--memory" : "";

  const benchmarkObj = {
    kind: "benchmark",
    processor,
    devices,
    display_type: displayType,
    default_device: best,
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

// The two runs of a pair should share a Julia version and OS; show both if not
function sameOrBoth(a, b) {
  return a === b ? a : `${a} / ${b}`;
}

// What the pairs of a ratio are called in messages: CPUs, GPUs, or CPU–GPU pairs
export function pairNoun(numeratorProcessor, denominatorProcessor, count) {
  if (numeratorProcessor !== denominatorProcessor) {
    return count === 1 ? "CPU–GPU pair" : "CPU–GPU pairs";
  }
  const name = numeratorProcessor.toUpperCase();
  return count === 1 ? name : `${name}s`;
}

/**
 * Ratio of one benchmark's median time (or memory estimate) to another's,
 * summarized by the median over pairs of runs. Two CPU benchmarks are paired on
 * every CPU that ran both, and two GPU benchmarks on every GPU that ran both,
 * so those ratios never mix machines. A CPU benchmark and a GPU benchmark never
 * run on the same processor, so they're paired in every CPU–GPU combination.
 * Each pair names its `cpu` and/or `gpu`, which the page can narrow them to.
 * `numerator` and `denominator` are `{ label, processor, devices }` with
 * `processor` and `devices` as returned by loadBenchmarkData. The larger one
 * goes first, so the ratio reads as "N× faster", "N× slower", "N× more", or
 * "N× less" and a reference can't be written the wrong way round: a median
 * below 1× is an error.
 */
export function computeRatio(numerator, denominator, displayType = "median_time") {
  const { field, parse, noun } = displayTypeFor(
    displayType,
    `${numerator.label}/${denominator.label}`
  );

  const sameProcessor = numerator.processor === denominator.processor;
  const pairs = [];
  for (const [numeratorName, numeratorRun] of Object.entries(numerator.devices)) {
    for (const [denominatorName, denominatorRun] of Object.entries(denominator.devices)) {
      if (sameProcessor && numeratorName !== denominatorName) continue;
      const where = sameProcessor ? numeratorName : `${numeratorName} and ${denominatorName}`;

      const top = numeratorRun[field];
      const bottom = denominatorRun[field];
      const topValue = parse(top);
      const bottomValue = parse(bottom);
      if (!Number.isFinite(topValue) || !Number.isFinite(bottomValue)) {
        throw new Error(`Can't divide "${top}" by "${bottom}" on ${where}`);
      }
      if (bottomValue <= 0) {
        throw new Error(
          `${denominator.label} is ${bottom} on ${where}, so there's no ratio; show both with @benchmark instead`
        );
      }

      const ratio = topValue / bottomValue;
      pairs.push({
        [numerator.processor]: numeratorName,
        [denominator.processor]: denominatorName,
        ratio,
        ratio_text: formatRatio(ratio),
        numerator_value: top,
        denominator_value: bottom,
        julia_version: sameOrBoth(numeratorRun.julia_version, denominatorRun.julia_version),
        os: sameOrBoth(numeratorRun.os, denominatorRun.os),
      });
    }
  }

  if (pairs.length === 0) {
    throw new Error(
      `${numerator.label} and ${denominator.label} were not benchmarked on any of the same ` +
        pairNoun(numerator.processor, denominator.processor, 2)
    );
  }

  const ratios = pairs.map((pair) => pair.ratio);
  const medianRatio = median(ratios);
  if (medianRatio < 1) {
    const over = `${ratios.length} ${pairNoun(numerator.processor, denominator.processor, ratios.length)}`;
    throw new Error(
      `${denominator.label} has a larger ${noun} than ${numerator.label} (median ratio ` +
        `${formatRatio(medianRatio)} over ${over}); put the larger one first`
    );
  }

  return {
    pairs,
    median: medianRatio,
    min: Math.min(...ratios),
    max: Math.max(...ratios),
  };
}

/**
 * Process @ratio[file:key/key] or @ratio[file:key/key:display_type] and return
 * an HTML span showing how many times larger the first benchmark's median time
 * (or memory estimate) is than the second's. The ratio is taken over the pairs
 * computeRatio makes, so it never mixes machines unless one benchmark ran on a
 * CPU and the other on a GPU, and the median over those pairs is shown.
 */
export function processRatio(reference) {
  const { slug, numeratorKey, denominatorKey, displayType } = parseRatioReference(reference);
  const numerator = { label: `${slug}:${numeratorKey}`, ...loadBenchmarkData(slug, numeratorKey) };
  const denominator = {
    label: `${slug}:${denominatorKey}`,
    ...loadBenchmarkData(slug, denominatorKey),
  };
  const ratio = computeRatio(numerator, denominator, displayType);

  const ratioObj = {
    kind: "ratio",
    display_type: displayType,
    numerator_key: numeratorKey,
    denominator_key: denominatorKey,
    numerator_processor: numerator.processor,
    denominator_processor: denominator.processor,
    pairs: ratio.pairs,
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
