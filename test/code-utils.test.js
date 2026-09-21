import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCodeReference } from "../config/code-utils.js";
import { resolveSourcePath } from "../config/pe-solutions.js";

test("a bare file reference selects the whole file", () => {
  assert.deepEqual(parseCodeReference("problem-0024"), { file: "problem-0024", selectors: [] });
});

test("selectors are comma-separated and may contain spaces", () => {
  assert.deepEqual(
    parseCodeReference("problem-0033:using Combinatorics, multiply_curious_fractions"),
    { file: "problem-0033", selectors: ["using Combinatorics", "multiply_curious_fractions"] }
  );
  assert.deepEqual(parseCodeReference("problem-0012:14-36"), {
    file: "problem-0012",
    selectors: ["14-36"],
  });
});

test("a trailing colon with nothing selected is an error", () => {
  assert.throws(() => parseCodeReference("problem-0012:"), /nothing selected/);
  assert.throws(() => parseCodeReference(":solve"), /missing file/);
});

test("problem and bonus slugs map to solution files", () => {
  assert.equal(resolveSourcePath("problem-0012"), "src/solutions/problem0012.jl");
  assert.equal(resolveSourcePath("bonus-18i"), "src/solutions/bonus_18i.jl");
  assert.equal(resolveSourcePath("bonus-root13"), "src/solutions/bonus_root13.jl");
});

test("anything else is a repository-relative path", () => {
  assert.equal(resolveSourcePath("src/utils/Divisors.jl"), "src/utils/Divisors.jl");
  assert.equal(
    resolveSourcePath("./benchmarks/benchmark_problem0012.jl"),
    "benchmarks/benchmark_problem0012.jl"
  );
});

test("paths cannot escape the repository", () => {
  assert.throws(() => resolveSourcePath("../secrets"), /inside the repository/);
  assert.throws(() => resolveSourcePath("src/../../secrets"), /inside the repository/);
  assert.throws(() => resolveSourcePath("/etc/passwd"), /inside the repository/);
});
