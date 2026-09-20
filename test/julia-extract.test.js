import { test } from "node:test";
import assert from "node:assert/strict";
import { dedent, extractDefinitions, parseTopLevel } from "../config/julia-extract.js";

const SOLUTION = `"""
Project Euler Problem 12: Highly Divisible Triangular Number
"""
module Problem0012

export find_first_triangle_with_divisors, solve

using ProjectEulerSolutions.Utils.Divisors: num_divisors
using Combinatorics: combinations, permutations

const LEN_BITS = 4
const DIGIT_BITS = 5

const BIG_NUMBER =
    "7316717653" *
    "9698352031"

const NUMBER_WORDS = Dict(
    1 => "one",

    2 => "two",
)

"""
    num_divisors(n)

Return the number of divisors of n.
"""
function num_divisors(n)
    count = 0
    for i in 1:isqrt(n)
        if n % i == 0
            count += 2
        end
    end
    return count
end

# A comment right above a definition is not part of it
@inline function det3_mod(M, p) # trailing comment mentioning end
    return M[end] % p
end

function find_first_triangle_with_divisors(min_divisors)
    n = 1
    while true
        if iseven(n)
            return n
        end
        n += 1
    end
end

abstract type PrimalityTest end

function f end

solve() = find_first_triangle_with_divisors(500)

is_prime(n) = is_prime(n, DEFAULT)
is_prime(n, test) = n > 1

open("file.txt") do io
    println(io, "x")
end

end # module
`;

function statement(name) {
  const found = parseTopLevel(SOLUTION).filter((s) => s.names.includes(name));
  assert.ok(found.length > 0, `expected a statement named ${name}`);
  return found;
}

test("function blocks span from the definition line to the column-0 end", () => {
  const [fn] = statement("find_first_triangle_with_divisors");
  assert.equal(fn.kind, "function");
  assert.equal(fn.start, 44);
  assert.equal(fn.end, 52);
});

test("docstrings and preceding comments are not part of a definition", () => {
  const [fn] = statement("num_divisors");
  assert.equal(fn.start, 29);
  assert.equal(fn.end, 37);
  const [inlined] = statement("det3_mod");
  assert.equal(inlined.start, 40);
  assert.equal(inlined.end, 42);
});

test("multi-line constants extend over continuation lines, brackets and blank lines", () => {
  assert.deepEqual(statement("LEN_BITS")[0], {
    kind: "const",
    names: ["LEN_BITS"],
    start: 11,
    end: 11,
  });
  assert.deepEqual(statement("BIG_NUMBER")[0], {
    kind: "const",
    names: ["BIG_NUMBER"],
    start: 14,
    end: 16,
  });
  assert.deepEqual(statement("NUMBER_WORDS")[0], {
    kind: "const",
    names: ["NUMBER_WORDS"],
    start: 18,
    end: 22,
  });
});

test("single-line blocks and short-form functions are one line each", () => {
  assert.deepEqual(statement("PrimalityTest")[0], {
    kind: "type",
    names: ["PrimalityTest"],
    start: 54,
    end: 54,
  });
  assert.deepEqual(statement("f")[0], { kind: "function", names: ["f"], start: 56, end: 56 });
  assert.deepEqual(statement("solve")[0], {
    kind: "function",
    names: ["solve"],
    start: 58,
    end: 58,
  });
});

test("a name matches every method defined for it", () => {
  const methods = statement("is_prime");
  assert.deepEqual(
    methods.map((m) => m.start),
    [60, 61]
  );
});

test("do blocks close at the column-0 end", () => {
  const block = parseTopLevel(SOLUTION).find((s) => s.start === 63);
  assert.equal(block.end, 65);
});

test("a module header is a one-line statement so its body parses as top level", () => {
  const [mod] = statement("Problem0012");
  assert.deepEqual(mod, { kind: "module", names: ["Problem0012"], start: 4, end: 4 });
});

test("imports are selectable by module name", () => {
  assert.deepEqual(statement("using Combinatorics")[0].names, ["using Combinatorics"]);
  assert.equal(statement("using ProjectEulerSolutions.Utils.Divisors")[0].start, 8);
});

test("extractDefinitions joins selections and reports the spanned lines", () => {
  const { code, startLine, endLine } = extractDefinitions(SOLUTION, ["solve", "num_divisors"]);
  assert.equal(startLine, 29);
  assert.equal(endLine, 58);
  assert.match(
    code,
    /^solve\(\) = find_first_triangle_with_divisors\(500\)\n\nfunction num_divisors\(n\)/
  );
  assert.match(code, /return count\nend$/);
});

test("adjacent selections keep the file's spacing", () => {
  const { code } = extractDefinitions(SOLUTION, ["LEN_BITS", "DIGIT_BITS"]);
  assert.equal(code, "const LEN_BITS = 4\nconst DIGIT_BITS = 5");
});

test("line ranges are 1-based and inclusive", () => {
  const { code, startLine, endLine } = extractDefinitions(SOLUTION, ["11-12"]);
  assert.equal(code, "const LEN_BITS = 4\nconst DIGIT_BITS = 5");
  assert.equal(startLine, 11);
  assert.equal(endLine, 12);
  assert.throws(() => extractDefinitions(SOLUTION, ["60-999"]), /outside the file \(67 lines\)/);
});

test("an unknown name lists what is available", () => {
  assert.throws(
    () => extractDefinitions(SOLUTION, ["nope"]),
    /No top-level definition named "nope"\. Available: .*num_divisors/
  );
});

test("an unterminated block is an error rather than a silent truncation", () => {
  assert.throws(() => parseTopLevel("function broken(x)\n    return x\n"), /No closing "end"/);
});

test("dedent removes only the indentation shared by every line", () => {
  assert.equal(dedent("    a\n\n      b\n    c"), "a\n\n  b\nc");
  assert.equal(dedent("a\n  b"), "a\n  b");
});
