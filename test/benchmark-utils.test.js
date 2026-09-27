import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRatio, formatRatio, parseRatioReference } from "../config/benchmark-utils.js";

// Benchmarks as loadBenchmarkData returns them, with one value per CPU
function benchmark(label, values, { field = "median_time", juliaVersion = "Julia 1.12.3" } = {}) {
  const cpus = {};
  for (const [cpuName, value] of Object.entries(values)) {
    cpus[cpuName] = { [field]: value, julia_version: juliaVersion, os: "Linux" };
  }
  return { label, cpus };
}

const allocating = (label, values) => benchmark(label, values, { field: "memory_estimate" });

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

  assert.deepEqual(Object.keys(ratio.cpus), ["A", "B", "C"]);
  assert.deepEqual(ratio.cpus.B, {
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
  assert.equal(ratio.cpus.A.ratio_text, "100×");
  assert.equal(ratio.cpus.A.numerator_value, "95.37 MiB");
  assert.equal(ratio.cpus.A.denominator_value, "976.63 KiB");
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
  assert.equal(ratio.cpus.A.julia_version, "Julia 1.12.3 / Julia 1.12.6");
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
  assert.equal(ratio.cpus.C.ratio_text, "0.800×");
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
