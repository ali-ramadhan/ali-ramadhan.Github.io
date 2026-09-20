/**
 * Code Utilities
 * Resolves `@code[...]` references against the pinned ProjectEulerSolutions.jl snapshot
 */

import path from "path";
import { extractDefinitions } from "./julia-extract.js";
import { githubUrl, readSolutionsFile, resolveSourcePath } from "./pe-solutions.js";

// Prism language for each file extension; anything else renders unhighlighted
const LANGUAGES = {
  ".jl": "julia",
  ".toml": "toml",
  ".py": "python",
  ".sh": "bash",
  ".json": "json",
};

/**
 * Parse the inside of `@code[...]`:
 *   problem-0012                                → whole file
 *   problem-0012:find_first_triangle_with_divisors
 *   problem-0014:collatz_length,longest_collatz_under
 *   problem-0012:14-36
 *   src/utils/Divisors.jl:num_divisors
 */
export function parseCodeReference(reference) {
  const separator = reference.indexOf(":");
  const file = (separator === -1 ? reference : reference.slice(0, separator)).trim();
  const selectorText = separator === -1 ? "" : reference.slice(separator + 1);
  const selectors = selectorText
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);

  if (!file) {
    throw new Error(`@code[${reference}]: missing file`);
  }
  if (separator !== -1 && selectors.length === 0) {
    throw new Error(`@code[${reference}]: nothing selected after ":"`);
  }

  return { file, selectors };
}

/**
 * Resolve a `@code[...]` reference to the code to embed plus where it came from.
 */
export function processCode(reference) {
  const { file, selectors } = parseCodeReference(reference);
  const sourcePath = resolveSourcePath(file);
  const source = readSolutionsFile(sourcePath);

  let code;
  let startLine;
  let endLine;

  if (selectors.length === 0) {
    code = source.replace(/\r\n/g, "\n").replace(/\s+$/, "");
  } else {
    try {
      ({ code, startLine, endLine } = extractDefinitions(source, selectors));
    } catch (error) {
      throw new Error(`@code[${reference}] in ${sourcePath}: ${error.message}`, { cause: error });
    }
  }

  return {
    code,
    language: LANGUAGES[path.posix.extname(sourcePath)] ?? "",
    sourcePath,
    startLine,
    endLine,
    url: githubUrl(sourcePath, startLine, endLine),
  };
}
