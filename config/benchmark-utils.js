/**
 * Benchmark Utilities
 * Shared functions for processing benchmark data in Node.js context
 */

import { readFileSync } from "fs";
import path from "path";
import yaml from "js-yaml";

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
  return value;
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
  return value;
}

/**
 * Load and process benchmark data from YAML file
 * Returns null if file or key not found
 */
export function loadBenchmarkData(filename, key) {
  try {
    const benchmarkPath = path.join(
      process.cwd(),
      "_data",
      "project-euler",
      "benchmarks",
      `${filename}-benchmarks.yaml`
    );
    const fileData = yaml.load(readFileSync(benchmarkPath, "utf8"));
    const cpuBenchmarks = fileData[key];

    if (!cpuBenchmarks || typeof cpuBenchmarks !== "object") {
      return null;
    }

    // Build cpus object with all CPU data
    const cpus = {};
    for (const [cpuName, benchmark] of Object.entries(cpuBenchmarks)) {
      if (benchmark && benchmark.output) {
        const medianMatch = benchmark.output.match(/median[^:]*:.*?([\d.]+\s+[nμm]?s)/);
        const medianTime = medianMatch ? medianMatch[1] : "Unknown";
        const memoryMatch = benchmark.output.match(/Memory estimate[^:]*:.*?([\d.]+\s*(?:bytes|[KMG]iB|[KMG]B))/i);
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
      return null;
    }

    return cpus;
  } catch (error) {
    return null;
  }
}

/**
 * Process benchmark and return HTML span element
 */
export function processBenchmark(filename, key, displayType = "median_time") {
  const cpus = loadBenchmarkData(filename, key);

  if (!cpus) {
    return `<span class="benchmark-reference">—</span>`;
  }

  // Find best CPU based on display type
  const bestCpu = Object.keys(cpus).reduce((best, cpu) => {
    if (displayType === "memory") {
      return parseMemory(cpus[cpu].memory_estimate) < parseMemory(cpus[best].memory_estimate) ? cpu : best;
    } else {
      return parseTime(cpus[cpu].median_time) < parseTime(cpus[best].median_time) ? cpu : best;
    }
  });

  const displayValue = displayType === "memory"
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
