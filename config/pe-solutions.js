/**
 * ProjectEulerSolutions.jl Snapshot
 *
 * The Project Euler posts pull their code and benchmark data straight from the
 * ProjectEulerSolutions.jl repository, so there is a single source of truth.
 * `pe-solutions.json` pins the exact commit the site builds against; before a
 * build starts we shallow-fetch that commit into `.cache/pe-solutions/<sha>/`
 * (once per commit, cached across rebuilds) and everything downstream reads
 * plain files from there. Run `npm run pe:bump` to move the pin.
 */

import { execFileSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "fs";
import path from "path";

export const PIN_FILE = path.join(process.cwd(), "pe-solutions.json");
export const CACHE_DIR = path.join(process.cwd(), ".cache", "pe-solutions");

const SHA_PATTERN = /^[0-9a-f]{40}$/;

// Solution files are addressed by the same slugs as the benchmark data
// (`problem-0012`, `bonus-18i`); anything else is a path relative to the repo root.
const SOLUTION_SLUG = /^(problem-\d{4}|bonus-[a-z0-9-]+)$/;

// Set once the pinned commit is on disk; read by every `@code` and
// `@benchmark` reference during the build.
let active = null;

/**
 * Read and validate `pe-solutions.json`.
 */
export function loadPin() {
  let pin;
  try {
    pin = JSON.parse(readFileSync(PIN_FILE, "utf8"));
  } catch (cause) {
    throw new Error(`Could not read ${path.relative(process.cwd(), PIN_FILE)}: ${cause.message}`, {
      cause,
    });
  }

  if (typeof pin.repo !== "string" || !/^https:\/\/\S+$/.test(pin.repo)) {
    throw new Error(
      `pe-solutions.json: "repo" must be an https URL, got ${JSON.stringify(pin.repo)}`
    );
  }
  if (typeof pin.commit !== "string" || !SHA_PATTERN.test(pin.commit)) {
    throw new Error(
      `pe-solutions.json: "commit" must be a full 40-character SHA, got ${JSON.stringify(pin.commit)}`
    );
  }

  return { repo: pin.repo.replace(/\/$/, ""), commit: pin.commit };
}

export function writePin({ repo, commit }) {
  writeFileSync(PIN_FILE, JSON.stringify({ repo, commit }, null, 2) + "\n");
}

/**
 * Make sure the pinned commit is checked out under the cache directory and
 * activate it for this build. Cheap when the snapshot already exists.
 */
export function prepareSolutions() {
  const pin = loadPin();
  const target = path.join(CACHE_DIR, pin.commit);

  if (!existsSync(target)) {
    fetchSnapshot(pin, target);
  }
  pruneCache(pin.commit);

  active = { ...pin, dir: target };
  return active;
}

function fetchSnapshot(pin, target) {
  console.log(
    `[pe-solutions] Fetching ${pin.repo}@${pin.commit.slice(0, 7)} into ${path.relative(process.cwd(), target)}`
  );

  // Build in a scratch directory and rename on success, so a failed or
  // interrupted fetch never leaves a half-populated snapshot behind.
  const scratch = `${target}.tmp-${process.pid}`;
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch, { recursive: true });

  try {
    git(["init", "-q"], scratch);
    git(["fetch", "-q", "--depth", "1", pin.repo, pin.commit], scratch);
    git(["-c", "advice.detachedHead=false", "checkout", "-q", "FETCH_HEAD"], scratch);
    // Keep the snapshot a plain tree of files, not a nested git repository
    rmSync(path.join(scratch, ".git"), { recursive: true, force: true });
    renameSync(scratch, target);
  } catch (error) {
    rmSync(scratch, { recursive: true, force: true });
    throw new Error(
      `Failed to fetch ${pin.repo} at commit ${pin.commit}. ` +
        `Check that the commit is pushed and that git can reach GitHub.\n${error.message}`,
      { cause: error }
    );
  }
}

function git(args, cwd) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
      // Never hang on a credentials prompt; the repository is public
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
  } catch (error) {
    const stderr = (error.stderr || "").trim();
    throw new Error(`git ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`, { cause: error });
  }
}

/**
 * Drop snapshots of other commits (and leftover scratch directories) so the
 * cache only ever holds the pinned commit.
 */
function pruneCache(keepCommit) {
  for (const entry of readdirSync(CACHE_DIR)) {
    if (entry !== keepCommit) {
      rmSync(path.join(CACHE_DIR, entry), { recursive: true, force: true });
    }
  }
}

/**
 * The active snapshot (`{ repo, commit, dir }`). Throws if `prepareSolutions()`
 * has not run yet, which happens in the `eleventy.before` hook.
 */
export function activeSolutions() {
  if (!active) {
    throw new Error(
      "ProjectEulerSolutions.jl snapshot is not prepared; prepareSolutions() must run before rendering"
    );
  }
  return active;
}

/**
 * Map a `@code` file reference to a path relative to the repository root:
 * `problem-0012` → `src/solutions/problem0012.jl`, `bonus-18i` →
 * `src/solutions/bonus_18i.jl`, anything else is used as given.
 */
export function resolveSourcePath(reference) {
  const trimmed = reference.trim();

  if (SOLUTION_SLUG.test(trimmed)) {
    return `src/solutions/${trimmed.replace("problem-", "problem").replace(/-/g, "_")}.jl`;
  }

  const normalized = path.posix.normalize(trimmed.replace(/\\/g, "/"));
  if (normalized.startsWith("../") || normalized === ".." || path.posix.isAbsolute(normalized)) {
    throw new Error(`Invalid source path "${reference}": paths must stay inside the repository`);
  }
  return normalized;
}

/**
 * Read a file from the active snapshot by its repository-relative path.
 */
export function readSolutionsFile(relativePath) {
  const absolute = path.join(activeSolutions().dir, relativePath);
  if (!existsSync(absolute)) {
    throw new Error(
      `${relativePath} does not exist in ProjectEulerSolutions.jl at the pinned commit`
    );
  }
  return readFileSync(absolute, "utf8");
}

/**
 * Permalink to a file (optionally a line range) at the pinned commit.
 */
export function githubUrl(relativePath, startLine, endLine) {
  const { repo, commit } = activeSolutions();
  let url = `${repo}/blob/${commit}/${relativePath}`;
  if (startLine) {
    url += endLine && endLine !== startLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`;
  }
  return url;
}
