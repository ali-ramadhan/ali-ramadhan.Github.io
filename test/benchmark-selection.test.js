import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRatio as formatRatioAtBuild } from "../config/benchmark-utils.js";
import {
  formatRatio,
  matchingPairs,
  pairLabel,
  referenceText,
  runDetails,
} from "../js/modules/benchmark.js";

const none = { cpu: null, gpu: null };

// A @benchmark reference's data, as js/modules/benchmark.js reads it
const cpuBenchmark = {
  kind: "benchmark",
  processor: "cpu",
  display_type: "median_time",
  default_text: "1.000 s",
  devices: {
    A: { median_time: "1.000 s", memory_estimate: "16 bytes" },
    B: { median_time: "2.000 s", memory_estimate: "32 bytes" },
  },
};

const gpuBenchmark = {
  kind: "benchmark",
  processor: "gpu",
  display_type: "median_time",
  default_text: "1.000 ms",
  devices: {
    V100: { median_time: "2.000 ms" },
    A100: { median_time: "1.000 ms" },
  },
};

// The ratio of the CPU benchmark to the GPU one, paired in every combination
const cpuToGpu = {
  kind: "ratio",
  numerator_processor: "cpu",
  denominator_processor: "gpu",
  default_text: "1,000×",
  pairs: [
    { cpu: "A", gpu: "V100", ratio: 500, ratio_text: "500×" },
    { cpu: "A", gpu: "A100", ratio: 1000, ratio_text: "1,000×" },
    { cpu: "B", gpu: "V100", ratio: 1000, ratio_text: "1,000×" },
    { cpu: "B", gpu: "A100", ratio: 2000, ratio_text: "2,000×" },
  ],
};

// A ratio of two CPU benchmarks, paired on each CPU
const cpuToCpu = {
  kind: "ratio",
  numerator_processor: "cpu",
  denominator_processor: "cpu",
  default_text: "3.00×",
  pairs: [
    { cpu: "A", ratio: 2, ratio_text: "2.00×" },
    { cpu: "B", ratio: 4, ratio_text: "4.00×" },
  ],
};

test("a benchmark follows the pick of its own kind of processor only", () => {
  assert.equal(referenceText(cpuBenchmark, none), "1.000 s");
  assert.equal(referenceText(cpuBenchmark, { cpu: "B", gpu: null }), "2.000 s");
  assert.equal(referenceText(cpuBenchmark, { cpu: null, gpu: "V100" }), "1.000 s");
  assert.equal(referenceText(cpuBenchmark, { cpu: "C", gpu: null }), "n/a");

  // Picking a CPU-only machine leaves GPU numbers alone
  assert.equal(referenceText(gpuBenchmark, { cpu: "C", gpu: null }), "1.000 ms");
  assert.equal(referenceText(gpuBenchmark, { cpu: "C", gpu: "V100" }), "2.000 ms");
  assert.equal(referenceText(gpuBenchmark, { cpu: null, gpu: "H100" }), "n/a");
});

test("a memory reference shows the memory estimate on the pick", () => {
  const memory = { ...cpuBenchmark, display_type: "memory", default_text: "16 bytes" };
  assert.equal(referenceText(memory, { cpu: "B", gpu: null }), "32 bytes");
});

test("a CPU–GPU ratio is the median over the pairs the picks leave", () => {
  assert.equal(referenceText(cpuToGpu, none), "1,000×");
  assert.equal(referenceText(cpuToGpu, { cpu: "A", gpu: "A100" }), "1,000×");
  assert.equal(referenceText(cpuToGpu, { cpu: "B", gpu: "A100" }), "2,000×");

  // One pick leaves a pair per processor of the other kind
  assert.equal(referenceText(cpuToGpu, { cpu: "A", gpu: null }), "750×");
  assert.equal(referenceText(cpuToGpu, { cpu: null, gpu: "V100" }), "750×");
  assert.deepEqual(
    matchingPairs(cpuToGpu, { cpu: null, gpu: "V100" }).map((pair) => pair.cpu),
    ["A", "B"]
  );

  // A CPU or GPU that never ran the benchmark leaves no pairs
  assert.equal(referenceText(cpuToGpu, { cpu: "C", gpu: null }), "n/a");
});

test("a ratio of two CPU benchmarks ignores the GPU pick", () => {
  assert.equal(referenceText(cpuToCpu, { cpu: null, gpu: "V100" }), "3.00×");
  assert.equal(referenceText(cpuToCpu, { cpu: "B", gpu: "V100" }), "4.00×");
  assert.equal(matchingPairs(cpuToCpu, { cpu: null, gpu: "V100" }).length, 2);
});

test("pairLabel names a pair in the order of the ratio", () => {
  assert.equal(pairLabel(cpuToCpu, cpuToCpu.pairs[1]), "B");
  assert.equal(pairLabel(cpuToGpu, cpuToGpu.pairs[1]), "A ÷ A100");
  const gpuToCpu = { ...cpuToGpu, numerator_processor: "gpu", denominator_processor: "cpu" };
  assert.equal(pairLabel(gpuToCpu, cpuToGpu.pairs[1]), "A100 ÷ A");
});

test("runDetails adds the host CPU and CUDA versions for a GPU run", () => {
  assert.equal(runDetails({ julia_version: "Julia 1.13.1", os: "Linux" }), "Julia 1.13.1 · Linux");
  assert.equal(
    runDetails({
      julia_version: "Julia 1.13.1",
      os: "Linux",
      host_cpu: "2 × AMD EPYC 9374F",
      cuda_runtime: "12.9.0",
      cuda_jl: "6.4.1",
      nvidia_driver: "535.309.01",
    }),
    "Host CPU: 2 × AMD EPYC 9374F · Julia 1.13.1 · CUDA 12.9.0 · CUDA.jl 6.4.1 · " +
      "NVIDIA driver 535.309.01 · Linux"
  );
});

test("ratios formatted in the browser match the ones formatted at build time", () => {
  for (const ratio of [0.9, 1, 1.624, 15.3, 750, 815.1, 2366.45, 3340691.6]) {
    assert.equal(formatRatio(ratio), formatRatioAtBuild(ratio));
  }
});
