import { test } from "node:test";
import assert from "node:assert/strict";
import {
  benchmarkRuns,
  computeRatio,
  formatRatio,
  pairNoun,
  parseRatioReference,
} from "../config/benchmark-utils.js";

// Benchmarks as loadBenchmarkData returns them, with one value per CPU (or GPU)
function benchmark(
  label,
  values,
  { field = "median_time", juliaVersion = "Julia 1.12.3", processor = "cpu" } = {}
) {
  const devices = {};
  for (const [name, value] of Object.entries(values)) {
    devices[name] = { [field]: value, julia_version: juliaVersion, os: "Linux" };
  }
  return { label, processor, devices };
}

const allocating = (label, values) => benchmark(label, values, { field: "memory_estimate" });
const onGpus = (label, values) => benchmark(label, values, { processor: "gpu" });

// The pair of a ratio on a CPU or GPU
const pairOn = (ratio, name) => ratio.pairs.find((pair) => pair.cpu === name || pair.gpu === name);

test("parseRatioReference splits the file, the two keys, and the display type", () => {
  assert.deepEqual(parseRatioReference("problem-0001:two_generator/two_inclusion_exclusion"), {
    slug: "problem-0001",
    numeratorKey: "two_generator",
    denominatorKey: "two_inclusion_exclusion",
    displayType: "median_time",
  });
  assert.deepEqual(
    parseRatioReference("problem-0010:sum_of_primes_below_200M/sum_of_primes_below_2M:memory"),
    {
      slug: "problem-0010",
      numeratorKey: "sum_of_primes_below_200M",
      denominatorKey: "sum_of_primes_below_2M",
      displayType: "memory",
    }
  );
  assert.equal(parseRatioReference("bonus-root13:a/b:median_time").displayType, "median_time");
});

test("parseRatioReference rejects anything but file:key/key[:display_type]", () => {
  assert.throws(() => parseRatioReference("problem-0001:two_generator"), /file:key\/key/);
  assert.throws(() => parseRatioReference("two_generator/two_inclusion_exclusion"), /file:key/);
  assert.throws(() => parseRatioReference("problem-0001:a/b/c"), /file:key\/key/);
  assert.throws(
    () => parseRatioReference("problem-0001:a/b:speed"),
    /Unknown benchmark display type "speed" for "problem-0001:a\/b"; expected one of median_time, memory/
  );
  assert.throws(() => parseRatioReference("problem-0001:a/b:constructor"), /Unknown/);
  assert.throws(() => parseRatioReference("problem-0001:a/a"), /compared with itself/);
});

test("formatRatio rounds to three significant figures", () => {
  assert.equal(formatRatio(2366.45), "2,370×");
  assert.equal(formatRatio(815.1), "815×");
  assert.equal(formatRatio(9639), "9,640×");
  assert.equal(formatRatio(15.3), "15.3×");
  assert.equal(formatRatio(1.624), "1.62×");
  assert.equal(formatRatio(1), "1.00×");
  assert.equal(formatRatio(0.9), "0.900×");
  assert.equal(formatRatio(3340691.6), "3,340,000×");
});

test("computeRatio divides median times per CPU, over the CPUs that ran both", () => {
  const ratio = computeRatio(
    benchmark("p:slow", {
      A: "2.000 μs",
      B: "6.000 μs",
      C: "1.000 ms",
      "Only slow": "1.000 s",
    }),
    benchmark("p:fast", {
      A: "1.000 ns",
      B: "2.000 ns",
      C: "250.000 ns",
      "Only fast": "1.000 ns",
    })
  );

  assert.deepEqual(
    ratio.pairs.map((pair) => pair.cpu),
    ["A", "B", "C"]
  );
  assert.deepEqual(pairOn(ratio, "B"), {
    cpu: "B",
    ratio: 3000,
    ratio_text: "3,000×",
    numerator_value: "6.000 μs",
    denominator_value: "2.000 ns",
    julia_version: "Julia 1.12.3",
    os: "Linux",
  });
  assert.equal(ratio.median, 3000);
  assert.equal(ratio.min, 2000);
  assert.equal(ratio.max, 4000);
});

test("computeRatio divides memory estimates across units", () => {
  const ratio = computeRatio(
    allocating("p:big", { A: "95.37 MiB", B: "95.37 MiB" }),
    allocating("p:small", { A: "976.63 KiB", B: "976.63 KiB" }),
    "memory"
  );
  assert.equal(pairOn(ratio, "A").ratio_text, "100×");
  assert.equal(pairOn(ratio, "A").numerator_value, "95.37 MiB");
  assert.equal(pairOn(ratio, "A").denominator_value, "976.63 KiB");
  assert.equal(ratio.min, ratio.max);
});

test("computeRatio has no ratio to show against 0 bytes", () => {
  assert.throws(
    () =>
      computeRatio(
        allocating("p:dict", { A: "133.20 MiB" }),
        allocating("p:naive", { A: "0 bytes" }),
        "memory"
      ),
    /p:naive is 0 bytes on A, so there's no ratio; show both with @benchmark instead/
  );
});

test("computeRatio takes the median of an even number of CPUs as the middle average", () => {
  const ratio = computeRatio(
    benchmark("p:slow", { A: "2.000 μs", B: "3.000 μs", C: "4.000 μs", D: "5.000 μs" }),
    benchmark("p:fast", { A: "1.000 ns", B: "1.000 ns", C: "1.000 ns", D: "1.000 ns" })
  );
  assert.equal(ratio.median, 3500);
});

test("computeRatio shows both Julia versions when the two runs on a CPU differ", () => {
  const ratio = computeRatio(
    benchmark("p:slow", { A: "2.000 μs" }, { juliaVersion: "Julia 1.12.3" }),
    benchmark("p:fast", { A: "1.000 ns" }, { juliaVersion: "Julia 1.12.6" })
  );
  assert.equal(pairOn(ratio, "A").julia_version, "Julia 1.12.3 / Julia 1.12.6");
});

test("computeRatio wants the larger one first", () => {
  // Most CPUs say otherwise, so the keys are the wrong way round
  assert.throws(
    () =>
      computeRatio(
        benchmark("p:naive", { A: "100.0 ms", B: "100.0 ms", C: "100.0 ms" }),
        benchmark("p:dict", { A: "160.0 ms", B: "90.0 ms", C: "170.0 ms" })
      ),
    /p:dict has a larger median time than p:naive \(median ratio 0\.625× over 3 CPUs\); put the larger one first/
  );
  assert.throws(
    () =>
      computeRatio(
        allocating("p:naive", { A: "0 bytes" }),
        allocating("p:dict", { A: "133.20 MiB" }),
        "memory"
      ),
    /p:dict has a larger memory estimate than p:naive/
  );
});

test("computeRatio allows individual CPUs below 1× when the median is above", () => {
  const ratio = computeRatio(
    benchmark("p:slow", { A: "100.0 ms", B: "100.0 ms", C: "100.0 ms" }),
    benchmark("p:fast", { A: "50.0 ms", B: "80.0 ms", C: "125.0 ms" })
  );
  assert.equal(ratio.median, 1.25);
  assert.equal(pairOn(ratio, "C").ratio_text, "0.800×");
});

test("computeRatio needs a CPU in common and values it can divide", () => {
  assert.throws(
    () =>
      computeRatio(benchmark("p:slow", { A: "2.000 μs" }), benchmark("p:fast", { B: "1.000 ns" })),
    /not benchmarked on any of the same CPUs/
  );
  assert.throws(
    () =>
      computeRatio(benchmark("p:slow", { A: "Unknown" }), benchmark("p:fast", { A: "1.000 ns" })),
    /Can't divide "Unknown" by "1.000 ns" on A/
  );
});

test("computeRatio pairs two GPU benchmarks on every GPU that ran both", () => {
  const ratio = computeRatio(
    onGpus("p:gpu_24", { V100: "300.0 ms", A100: "100.0 ms" }),
    onGpus("p:gpu_20", { V100: "3.000 ms", A100: "2.000 ms", H100: "1.000 ms" })
  );
  assert.deepEqual(
    ratio.pairs.map((pair) => [pair.gpu, pair.ratio_text]),
    [
      ["V100", "100×"],
      ["A100", "50.0×"],
    ]
  );
  assert.equal("cpu" in ratio.pairs[0], false);
  assert.equal(ratio.median, 75);
  assert.throws(
    () =>
      computeRatio(onGpus("p:slow", { V100: "2.000 μs" }), onGpus("p:fast", { A100: "1.000 ns" })),
    /not benchmarked on any of the same GPUs/
  );
});

test("computeRatio pairs a CPU benchmark with a GPU benchmark in every combination", () => {
  const ratio = computeRatio(
    benchmark("p:cpu", { A: "1.000 s", B: "2.000 s" }),
    onGpus("p:gpu", { V100: "2.000 ms", A100: "1.000 ms" })
  );
  assert.deepEqual(
    ratio.pairs.map((pair) => [pair.cpu, pair.gpu, pair.ratio]),
    [
      ["A", "V100", 500],
      ["A", "A100", 1000],
      ["B", "V100", 1000],
      ["B", "A100", 2000],
    ]
  );
  assert.equal(ratio.median, 1000);
  assert.equal(ratio.min, 500);
  assert.equal(ratio.max, 2000);

  // A GPU numerator works the same way round
  const slower = computeRatio(
    onGpus("p:gpu_big", { V100: "10.00 ms" }),
    benchmark("p:cpu_small", { A: "1.000 ms" })
  );
  assert.deepEqual(slower.pairs, [
    {
      gpu: "V100",
      cpu: "A",
      ratio: 10,
      ratio_text: "10.0×",
      numerator_value: "10.00 ms",
      denominator_value: "1.000 ms",
      julia_version: "Julia 1.12.3",
      os: "Linux",
    },
  ]);
});

test("computeRatio names the CPU and GPU of a CPU–GPU pair in its errors", () => {
  assert.throws(
    () => computeRatio(benchmark("p:cpu", { A: "Unknown" }), onGpus("p:gpu", { V100: "1.000 ms" })),
    /Can't divide "Unknown" by "1.000 ms" on A and V100/
  );
  assert.throws(
    () =>
      computeRatio(
        benchmark("p:cpu", { A: "1.000 ms", B: "1.000 ms" }),
        onGpus("p:gpu", { V100: "2.000 ms", A100: "2.000 ms" })
      ),
    /p:gpu has a larger median time than p:cpu \(median ratio 0\.500× over 4 CPU–GPU pairs\)/
  );
});

test("pairNoun names a ratio's pairs", () => {
  assert.equal(pairNoun("cpu", "cpu", 1), "CPU");
  assert.equal(pairNoun("cpu", "cpu", 3), "CPUs");
  assert.equal(pairNoun("gpu", "gpu", 2), "GPUs");
  assert.equal(pairNoun("cpu", "gpu", 1), "CPU–GPU pair");
  assert.equal(pairNoun("gpu", "cpu", 4), "CPU–GPU pairs");
});

// BenchmarkTools output with just the lines benchmarkRuns reads
const output = (median, memory) =>
  ` Time  (median):     ${median}              ┊ GC (median):    0.00%\n` +
  ` Memory estimate: ${memory}, allocs estimate: 98.`;

test("benchmarkRuns reads a CPU benchmark's runs", () => {
  const runs = benchmarkRuns(
    {
      "AMD Ryzen 9 5900X": {
        output: output("1.892 ns", "0 bytes"),
        julia_version: "Julia 1.13.1",
        os: "Linux",
      },
      "Intel Core i7-7700HQ": { output: output("2.500 ns", "0 bytes"), thread_count: 8 },
    },
    "problem-0004",
    "naive"
  );
  assert.equal(runs.processor, "cpu");
  assert.deepEqual(Object.keys(runs.devices), ["AMD Ryzen 9 5900X", "Intel Core i7-7700HQ"]);
  assert.equal(runs.devices["AMD Ryzen 9 5900X"].median_time, "1.892 ns");
  assert.equal(runs.devices["AMD Ryzen 9 5900X"].memory_estimate, "0 bytes");
  assert.equal(runs.devices["Intel Core i7-7700HQ"].thread_count, 8);
  assert.equal(runs.devices["AMD Ryzen 9 5900X"].host_cpu, undefined);
});

test("benchmarkRuns reads a GPU benchmark's runs with their host CPU and CUDA versions", () => {
  const runs = benchmarkRuns(
    {
      "NVIDIA V100 PCIe 32GB": {
        output: output("1.675 ms", "4.66 KiB"),
        julia_version: "Julia 1.13.1",
        os: "Linux",
        host_cpu: "2 × AMD EPYC 9374F",
        cuda_runtime: "12.9.0",
        cuda_jl: "6.4.1",
        nvidia_driver: "535.309.01",
      },
    },
    "problem-0004",
    "gpu_20_digits"
  );
  assert.equal(runs.processor, "gpu");
  assert.deepEqual(runs.devices["NVIDIA V100 PCIe 32GB"], {
    median_time: "1.675 ms",
    memory_estimate: "4.66 KiB",
    full_output: output("1.675 ms", "4.66 KiB"),
    julia_version: "Julia 1.13.1",
    os: "Linux",
    date: undefined,
    thread_count: undefined,
    host_cpu: "2 × AMD EPYC 9374F",
    cuda_runtime: "12.9.0",
    cuda_jl: "6.4.1",
    nvidia_driver: "535.309.01",
  });
});

test("benchmarkRuns wants runs with output, all on one kind of processor", () => {
  assert.throws(
    () => benchmarkRuns({ A: { julia_version: "Julia 1.13.1" } }, "problem-0004", "gpu_20_digits"),
    /Benchmark "gpu_20_digits" for "problem-0004" has no results with output/
  );
  assert.throws(
    () =>
      benchmarkRuns(
        {
          "AMD Ryzen 9 5900X": { output: output("1.000 s", "0 bytes") },
          "NVIDIA V100 PCIe 32GB": { output: output("1.000 ms", "0 bytes"), host_cpu: "AMD" },
        },
        "problem-0004",
        "mixed"
      ),
    /Benchmark "mixed" for "problem-0004" has results on both CPUs and GPUs; save them under different names/
  );
});
