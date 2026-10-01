import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import {
  activeSolutions,
  githubUrl,
  loadPin,
  localSolutionsDir,
  prepareSolutions,
  readSolutionsFile,
} from "../config/pe-solutions.js";

test("localSolutionsDir reads PE_SOLUTIONS_DIR, relative to the website's root", () => {
  assert.equal(localSolutionsDir({}), null);
  assert.equal(localSolutionsDir({ PE_SOLUTIONS_DIR: "  " }), null);
  assert.equal(localSolutionsDir({ PE_SOLUTIONS_DIR: "/tmp/solutions" }), "/tmp/solutions");
  assert.equal(
    localSolutionsDir({ PE_SOLUTIONS_DIR: "../ProjectEulerSolutions.jl" }),
    path.resolve(process.cwd(), "../ProjectEulerSolutions.jl")
  );
});

// A throwaway checkout with a single solution in it
function makeCheckout() {
  const dir = mkdtempSync(path.join(tmpdir(), "pe-solutions-"));
  mkdirSync(path.join(dir, "src", "solutions"), { recursive: true });
  writeFileSync(path.join(dir, "src", "solutions", "problem0001.jl"), "x = 1\n");
  return dir;
}

// Run f with PE_SOLUTIONS_DIR set to dir
function withLocalDir(dir, f) {
  const previous = process.env.PE_SOLUTIONS_DIR;
  process.env.PE_SOLUTIONS_DIR = dir;
  try {
    return f();
  } finally {
    if (previous === undefined) {
      delete process.env.PE_SOLUTIONS_DIR;
    } else {
      process.env.PE_SOLUTIONS_DIR = previous;
    }
  }
}

test("prepareSolutions reads the local checkout PE_SOLUTIONS_DIR names", () => {
  const dir = makeCheckout();
  try {
    const active = withLocalDir(dir, prepareSolutions);
    assert.equal(active.local, true);
    assert.equal(active.dir, dir);
    assert.equal(active.repo, loadPin().repo);
    // Not a git checkout, so View on GitHub links go to the pinned commit
    assert.equal(active.commit, loadPin().commit);

    assert.equal(readSolutionsFile("src/solutions/problem0001.jl"), "x = 1\n");
    assert.throws(
      () => readSolutionsFile("src/solutions/problem0002.jl"),
      /src\/solutions\/problem0002\.jl does not exist in the local ProjectEulerSolutions\.jl in /
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("View on GitHub links for a local git checkout go to its HEAD commit", () => {
  const dir = makeCheckout();
  try {
    const git = (...args) =>
      execFileSync("git", ["-c", "commit.gpgsign=false", ...args], {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "Test",
          GIT_AUTHOR_EMAIL: "test@example.com",
          GIT_COMMITTER_NAME: "Test",
          GIT_COMMITTER_EMAIL: "test@example.com",
        },
      });
    git("init", "-q");
    git("add", ".");
    git("commit", "-q", "-m", "A solution");
    const head = git("rev-parse", "HEAD").trim();

    withLocalDir(dir, prepareSolutions);
    assert.equal(activeSolutions().commit, head);
    assert.equal(
      githubUrl("src/solutions/problem0001.jl", 1, 1),
      `${loadPin().repo}/blob/${head}/src/solutions/problem0001.jl#L1`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("prepareSolutions rejects a PE_SOLUTIONS_DIR that isn't a ProjectEulerSolutions.jl checkout", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "pe-solutions-"));
  try {
    assert.throws(
      () => withLocalDir(dir, prepareSolutions),
      /isn't a ProjectEulerSolutions\.jl checkout: it has no src\/solutions\//
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
