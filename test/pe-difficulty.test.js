import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import {
  formatRatings,
  loadRatings,
  missingRatings,
  parseRating,
  postedProblems,
  writeRatings,
} from "../config/pe-difficulty.js";

// The info tooltip of https://projecteuler.net/problem=33, as served
const RATED = `<div id="problem_icons" class="noprint"><a href="minimal=33"><img src="/images/icons/file_html.png" title="Show HTML problem content" class="icon"></a>&nbsp;<span class="tooltip"><img src="/images/icons/info.png" class="icon"><span class="tooltiptext_right">Published on Friday, 20th December 2002, 06:00 pm and solved by 88836<br>Difficulty: Level 0 [3%]</span></span></div><div id="problem_info"><h3>Problem 33</h3></div>`;

// Problem 1010 two days after publication: no rating yet
const UNRATED = `<span class="tooltiptext_right">Published on Saturday, 19th September 2026, 08:00 pm and solved by 42<br></span>`;

// A bonus problem page has no info tooltip at all
const BONUS = `<h2>Problem Secret</h2><div class="problem_content" role="problem"><p>Find the secret word.</p></div>`;

test("parseRating reads the level and percentage from the info tooltip", () => {
  assert.deepEqual(parseRating(RATED), { level: 0, percent: 3 });
  assert.deepEqual(
    parseRating(
      "Published on Saturday, 6th June 2026, 08:00 pm and solved by 489<br>Difficulty: Level 15 [40%]"
    ),
    { level: 15, percent: 40 }
  );
});

test("parseRating returns null for a problem that has no rating yet", () => {
  assert.equal(parseRating(UNRATED), null);
});

test("parseRating rejects a page without publication info", () => {
  assert.throws(() => parseRating(BONUS), /no publication info/);
  assert.throws(() => parseRating(""), /no publication info/);
});

test("postedProblems lists the numbered posts by their front matter, in order", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "pe-difficulty-"));
  post(dir, "problem-0034.md", "problem_number: 34");
  post(dir, "problem-0002.md", "problem_number: 2");
  post(dir, "problem-0010.md", "problem_number: 10\nhidden: true");
  post(dir, "bonus-secret.md", "bonus_problem: true\ndifficulty_estimate: 54");
  writeFileSync(path.join(dir, "notes.txt"), "not a post\n");

  assert.deepEqual(postedProblems(dir), [2, 10, 34]);
});

test("postedProblems rejects a post whose front matter lacks its problem number", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "pe-difficulty-"));
  post(dir, "problem-0007.md", 'problem_name: "10 001st Prime"');

  assert.throws(
    () => postedProblems(dir),
    /problem-0007\.md: front matter has no integer problem_number/
  );
});

test("formatRatings writes one line per problem in problem order", () => {
  const text = formatRatings({
    fetched: "2026-09-21",
    problems: { 10: { level: 0, percent: 2 }, 2: { level: 0, percent: 1 }, 1010: null },
  });

  assert.equal(
    text,
    [
      "{",
      '  "fetched": "2026-09-21",',
      '  "problems": {',
      '    "2": { "level": 0, "percent": 1 },',
      '    "10": { "level": 0, "percent": 2 },',
      '    "1010": null',
      "  }",
      "}",
      "",
    ].join("\n")
  );
});

test("writeRatings and loadRatings round-trip, and missingRatings spots posts without one", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "pe-difficulty-"));
  const file = path.join(dir, "difficulty.json");
  const ratings = {
    fetched: "2026-09-21",
    problems: { 1: { level: 0, percent: 1 }, 1010: null },
  };
  writeRatings(ratings, file);
  assert.deepEqual(loadRatings(file), ratings);

  post(dir, "problem-0001.md", "problem_number: 1");
  post(dir, "problem-1010.md", "problem_number: 1010");
  post(dir, "problem-0034.md", "problem_number: 34");
  assert.deepEqual(missingRatings(dir, file), [34]);
});

test("loadRatings rejects a malformed ratings file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "pe-difficulty-"));
  const file = path.join(dir, "difficulty.json");

  writeFileSync(file, JSON.stringify({ max_difficulty_level: 39 }));
  assert.throws(() => loadRatings(file), /"fetched" must be a YYYY-MM-DD date/);

  writeFileSync(file, JSON.stringify({ fetched: "2026-09-21", problems: { 1: { percent: 101 } } }));
  assert.throws(() => loadRatings(file), /problem "1" must map to \{ level, percent \} or null/);

  writeFileSync(file, JSON.stringify({ fetched: "2026-09-21", problems: { root13: null } }));
  assert.throws(() => loadRatings(file), /problem "root13" must map to/);

  assert.throws(() => loadRatings(path.join(dir, "missing.json")), /Could not read/);
});

function post(dir, name, frontMatter) {
  writeFileSync(path.join(dir, name), `---\n${frontMatter}\n---\n\nBody.\n`);
}
