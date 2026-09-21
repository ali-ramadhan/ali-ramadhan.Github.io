#!/usr/bin/env node
/**
 * Re-pin ProjectEulerSolutions.jl
 *
 *   npm run pe:bump            pin the tip of the default branch on GitHub
 *   npm run pe:bump -- <ref>   pin a branch, tag, or full commit SHA
 *
 * Writes pe-solutions.json and fetches the new snapshot so the next build is
 * ready to go (and so a typo in the ref fails here, not in CI).
 */

import { execFileSync } from "child_process";
import { loadPin, prepareSolutions, writePin } from "../config/pe-solutions.js";

const ref = process.argv[2] ?? "HEAD";
const pin = loadPin();
const commit = resolveRef(pin.repo, ref);

if (commit === pin.commit) {
  console.log(`Already pinned to ${commit.slice(0, 7)} (${ref})`);
} else {
  writePin({ repo: pin.repo, commit });
  console.log(
    `Pinned ProjectEulerSolutions.jl: ${pin.commit.slice(0, 7)} → ${commit.slice(0, 7)} (${ref})`
  );
  console.log(`Changes: ${pin.repo}/compare/${pin.commit}...${commit}`);
}

prepareSolutions();

/**
 * Resolve a ref against the remote repository without cloning it.
 */
function resolveRef(repo, ref) {
  if (/^[0-9a-f]{40}$/.test(ref)) {
    return ref;
  }

  let output;
  try {
    output = execFileSync("git", ["ls-remote", repo, ref], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
  } catch (error) {
    console.error(`Could not query ${repo}: ${(error.stderr || error.message).trim()}`);
    process.exit(1);
  }

  const matches = output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"))
    // Annotated tags list both the tag object and the commit it points to (`^{}`)
    .filter(([, name]) => !name.endsWith("^{}"));

  if (matches.length === 0) {
    console.error(`No branch, tag, or HEAD named "${ref}" in ${repo}`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error(
      `"${ref}" is ambiguous in ${repo}; use a full ref name:\n` +
        matches.map(([sha, name]) => `  ${name} (${sha.slice(0, 7)})`).join("\n")
    );
    process.exit(1);
  }

  return matches[0][0];
}
