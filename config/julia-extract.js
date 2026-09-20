/**
 * Julia Source Extraction
 *
 * Pulls top-level definitions out of a Julia source file by name so blog posts
 * can embed `find_first_triangle_with_divisors` rather than lines 14–36 (which
 * silently go stale the moment something above them changes).
 *
 * This is not a Julia parser. It relies on the layout convention used
 * throughout ProjectEulerSolutions.jl: every top-level statement starts in
 * column 0, block statements (`function`, `struct`, ...) close with an `end` in
 * column 0, and continuation lines of multi-line expressions are indented.
 */

// Optional macro prefixes in front of a definition: `@inline function`, `Base.@kwdef struct`
const MACROS = String.raw`(?:[\w.]*@[\w.!]+\s+)*`;

// Statements that open a block closed by a matching `end`: either they start
// with a block keyword or, like `@testset "x" begin` and `open(f) do io`, end with one
const BLOCK_OPENER = new RegExp(
  `^${MACROS}(?:function|macro|(?:mutable\\s+)?struct|abstract\\s+type|primitive\\s+type|begin|let|for|while|if|try|quote)\\b`
);
const BLOCK_OPENER_SUFFIX = /\b(?:begin|do(?:\s+[\w,() ]*)?)\s*$/;

// Solution files wrap everything in `module Foo ... end`, with the module body
// itself at column 0, so a module header is treated as a one-line statement
const MODULE_HEAD = /^(?:bare)?module\s+(\w+)/;

// Head patterns that give a statement its selectable name
const NAMED_HEADS = [
  { kind: "function", pattern: new RegExp(`^${MACROS}function\\s+([\\w.!]+)`) },
  { kind: "macro", pattern: /^macro\s+([\w!]+)/ },
  { kind: "struct", pattern: new RegExp(`^${MACROS}(?:mutable\\s+)?struct\\s+(\\w+)`) },
  { kind: "type", pattern: /^(?:abstract|primitive)\s+type\s+(\w+)/ },
  { kind: "module", pattern: MODULE_HEAD },
  { kind: "const", pattern: /^const\s+(\w+)\s*=/ },
  { kind: "enum", pattern: /^@enum\s+(\w+)/ },
  // Short-form function definition: `solve() = compute_Q(12)`
  {
    kind: "function",
    pattern: new RegExp(
      `^${MACROS}([\\w.!]+)\\s*\\((?:[^()]|\\([^()]*\\))*\\)\\s*(?:::\\S+\\s*)?(?:where\\s*\\{[^}]*\\}\\s*)?=(?!=)`
    ),
  },
  // Plain top-level assignment: `x = 1`
  { kind: "assignment", pattern: /^(\w+)\s*=(?!=)/ },
];

// `using Foo: bar, baz` / `import Foo, Bar` are selected as `using Foo` / `import Bar`
const IMPORT_HEAD = /^(using|import)\s+([^#]*)/;

// A multi-line expression continues when the current line ends with an
// operator that needs a right-hand side
const CONTINUATION = /(?:[=*+\-/,]|&&|\|\||\bwhere)\s*(?:#.*)?$/;

const LINE_RANGE = /^(\d+)-(\d+)$/;

/**
 * Split a Julia file into top-level statements.
 * Returns `{ kind, names, start, end }` records with 1-based inclusive line numbers.
 */
export function parseTopLevel(source) {
  const lines = splitLines(source);
  const statements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank lines, comments and indented continuation lines never start a statement
    if (line.trim() === "" || /^\s/.test(line) || line.startsWith("#")) {
      i += 1;
      continue;
    }

    // Skip docstrings; the selected definition starts at the code itself
    if (line.startsWith('"""')) {
      i = findDocstringEnd(lines, i) + 1;
      continue;
    }

    const end = isBlockOpener(line) ? findBlockEnd(lines, i) : findExpressionEnd(lines, i);
    statements.push({ ...classify(line), start: i + 1, end: end + 1 });
    i = end + 1;
  }

  return statements;
}

// Lines of the file, without the empty entry a trailing newline would produce
function splitLines(source) {
  return source.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
}

function isBlockOpener(line) {
  if (MODULE_HEAD.test(line)) return false;
  return BLOCK_OPENER.test(line) || BLOCK_OPENER_SUFFIX.test(stripComment(line));
}

function findDocstringEnd(lines, start) {
  // A one-line docstring opens and closes on the same line
  if (lines[start].length > 3 && lines[start].endsWith('"""')) return start;
  for (let j = start + 1; j < lines.length; j++) {
    if (lines[j].trimEnd().endsWith('"""')) return j;
  }
  throw new Error(`Unterminated docstring starting at line ${start + 1}`);
}

function findBlockEnd(lines, start) {
  // Single-line forms: `function f end`, `abstract type Shape end`
  if (/\bend\s*$/.test(stripComment(lines[start]))) return start;
  for (let j = start + 1; j < lines.length; j++) {
    if (/^end\b/.test(lines[j])) return j;
  }
  throw new Error(`No closing "end" found for block starting at line ${start + 1}`);
}

function findExpressionEnd(lines, start) {
  let depth = bracketDepth(lines[start]);
  let end = start;

  for (let j = start + 1; j < lines.length; j++) {
    const line = lines[j];
    if (line.trim() === "") {
      if (depth > 0) continue; // blank line inside an open bracket
      break;
    }
    const continues = depth > 0 || /^\s/.test(line) || CONTINUATION.test(stripComment(lines[end]));
    if (!continues) break;
    depth += bracketDepth(line);
    end = j;
  }

  return end;
}

function stripComment(line) {
  return stripStrings(line).replace(/#.*$/, "");
}

function stripStrings(line) {
  return line.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)'/g, "''");
}

function bracketDepth(line) {
  const code = stripComment(line);
  let depth = 0;
  for (const char of code) {
    if (char === "(" || char === "[" || char === "{") depth += 1;
    else if (char === ")" || char === "]" || char === "}") depth -= 1;
  }
  return depth;
}

function classify(line) {
  const importMatch = IMPORT_HEAD.exec(line);
  if (importMatch) {
    const [, keyword, rest] = importMatch;
    // `using A.B: x, y` selects as `using A.B`; `using A, B` selects as either
    const modules = rest
      .split(":")[0]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    return { kind: keyword, names: modules.map((name) => `${keyword} ${name}`) };
  }

  for (const { kind, pattern } of NAMED_HEADS) {
    const match = pattern.exec(line);
    if (match) return { kind, names: [match[1]] };
  }

  return { kind: "other", names: [] };
}

/**
 * Extract the statements matching each selector, in the order given.
 *
 * A selector is a definition name (`num_divisors`, `NUMBER_WORDS`), an import
 * (`using Combinatorics`), or a 1-based inclusive line range (`14-36`). A name
 * matches every top-level statement defining it, so a function with several
 * methods comes out whole. Selected statements are joined by a blank line.
 *
 * Returns `{ code, startLine, endLine }` where the lines span everything selected.
 */
export function extractDefinitions(source, selectors) {
  const lines = splitLines(source);
  const statements = parseTopLevel(source);
  const ranges = [];

  for (const selector of selectors) {
    const rangeMatch = LINE_RANGE.exec(selector);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start < 1 || end < start || end > lines.length) {
        throw new Error(`Line range ${selector} is outside the file (${lines.length} lines)`);
      }
      ranges.push({ start, end });
      continue;
    }

    const matches = statements.filter((statement) => statement.names.includes(selector));
    if (matches.length === 0) {
      const available = [...new Set(statements.flatMap((statement) => statement.names))];
      throw new Error(
        `No top-level definition named "${selector}". Available: ${available.join(", ")}`
      );
    }
    ranges.push(...matches.map(({ start, end }) => ({ start, end })));
  }

  // Keep the file's own spacing between selections that only have blank lines
  // between them; separate everything else with one blank line
  let code = "";
  ranges.forEach((range, index) => {
    const chunk = lines.slice(range.start - 1, range.end).join("\n");
    if (index === 0) {
      code = chunk;
      return;
    }
    const previous = ranges[index - 1];
    const gap = range.start > previous.end ? lines.slice(previous.end, range.start - 1) : null;
    const onlyBlank = gap !== null && gap.every((line) => line.trim() === "");
    code += (onlyBlank ? "\n".repeat(gap.length + 1) : "\n\n") + chunk;
  });

  return {
    code: dedent(code),
    startLine: Math.min(...ranges.map((range) => range.start)),
    endLine: Math.max(...ranges.map((range) => range.end)),
  };
}

/**
 * Remove the indentation shared by every non-blank line.
 */
export function dedent(code) {
  const lines = code.split("\n");
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => line.match(/^[ \t]*/)[0].length);
  const common = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(Math.min(common, line.length))).join("\n");
}
