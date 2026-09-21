/**
 * Benchmark Utilities
 * Shared functions for processing benchmark data in Node.js context
 */

import yaml from "js-yaml";
import { readSolutionsFile } from "./pe-solutions.js";

const DISPLAY_TYPES = ["median_time", "memory"];

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
 * Process benchmark and return HTML span element
 */
export function processBenchmark(slug, key, displayType = "median_time") {
  if (!DISPLAY_TYPES.includes(displayType)) {
    throw new Error(
      `Unknown benchmark display type "${displayType}" for "${slug}:${key}"; expected one of ${DISPLAY_TYPES.join(", ")}`
    );
  }

  const cpus = loadBenchmarkData(slug, key);

  // Find best CPU based on display type
  const bestCpu = Object.keys(cpus).reduce((best, cpu) => {
    if (displayType === "memory") {
      return parseMemory(cpus[cpu].memory_estimate) < parseMemory(cpus[best].memory_estimate)
        ? cpu
        : best;
    } else {
      return parseTime(cpus[cpu].median_time) < parseTime(cpus[best].median_time) ? cpu : best;
    }
  });

  const displayValue =
    displayType === "memory"
      ? cpus[bestCpu]?.memory_estimate || "Unknown"
      : cpus[bestCpu]?.median_time || "Unknown";

  const cssModifier = displayType === "memory" ? " benchmark-reference--memory" : "";

  const benchmarkObj = {
    cpus: cpus,
    default_cpu: bestCpu,
    default_value: displayValue,
  };

  const escapedData = JSON.stringify(benchmarkObj).replace(/'/g, "&#39;");
  return `<span class="benchmark-reference${cssModifier}" data-benchmark='${escapedData}'>${displayValue}</span>`;
}
