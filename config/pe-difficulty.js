/**
 * Project Euler Difficulty Ratings
 *
 * Project Euler rates each problem with a difficulty percentage (and a level
 * derived from it) once enough people have solved it. The table of problems
 * shows that rating as a bar, reading it from `_data/project-euler/difficulty.json`,
 * which holds a copy for every problem with a post. Ratings drift as more
 * people solve the problems, so `npm run pe:difficulty` refreshes the file; the
 * build itself never touches the network for them.
 *
 * Every problem page (https://projecteuler.net/problem=<n>) shows the rating in
 * its info tooltip ("Published on ... and solved by 88836<br>Difficulty: Level
 * 0 [3%]") whether or not you are signed in, so no cookies are needed. The
 * archives table only shows ratings to signed-in members, and the bonus
 * problems are not rated at all: their posts carry a hand-entered
 * `difficulty_estimate` instead.
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import yaml from "js-yaml";

export const RATINGS_FILE = path.join(process.cwd(), "_data", "project-euler", "difficulty.json");
export const POSTS_DIR = path.join(process.cwd(), "blog", "project-euler");

const PROBLEM_URL = "https://projecteuler.net/problem=";
const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) aliramadhan.me pe-difficulty";

// The info tooltip on a problem page reads "Published on Friday, 20th December 2002,
// 06:00 pm and solved by 88836<br>Difficulty: Level 0 [3%]"; for a problem too new to
// be rated it stops after the "<br>".
const INFO_TOOLTIP =
  /Published on [^<]+ and solved by \d+<br>(?:Difficulty: Level (\d+) \[(\d+)%\])?/;

/**
 * The rating on a problem page: `{ level, percent }`, or `null` for a problem
 * too new to have one. Throws when the page has no publication info at all
 * (a bonus problem, or a change in the page layout).
 */
export function parseRating(html) {
  const match = INFO_TOOLTIP.exec(html);
  if (!match) {
    throw new Error(
      "no publication info found on the page (not a numbered problem, or the page layout changed)"
    );
  }
  const [, level, percent] = match;
  return level === undefined ? null : { level: Number(level), percent: Number(percent) };
}

/**
 * Fetch a problem's current rating from projecteuler.net.
 */
export async function fetchRating(number) {
  const response = await fetch(`${PROBLEM_URL}${number}`, {
    // An unknown problem number redirects to the archives
    redirect: "manual",
    headers: { "User-Agent": USER_AGENT },
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`no such problem: ${number}`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${PROBLEM_URL}${number}`);
  }
  return parseRating(await response.text());
}

/**
 * Numbers of the problems that have a post (drafts included), from the
 * `problem_number` front matter of `blog/project-euler/problem-*.md`, which is
 * also what the table looks the ratings up by.
 */
export function postedProblems(dir = POSTS_DIR) {
  const numbers = [];
  for (const file of readdirSync(dir)) {
    if (!/^problem-\d+\.md$/.test(file)) {
      continue;
    }
    const data = frontMatter(readFileSync(path.join(dir, file), "utf8"));
    if (!Number.isInteger(data.problem_number)) {
      throw new Error(`${file}: front matter has no integer problem_number`);
    }
    numbers.push(data.problem_number);
  }
  return numbers.sort((a, b) => a - b);
}

function frontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return match ? yaml.load(match[1]) || {} : {};
}

/**
 * Read and validate the ratings file: `{ fetched, problems }`, where each entry
 * of `problems` is `{ level, percent }` or `null` for a problem that had no
 * rating yet when it was last fetched.
 */
export function loadRatings(file = RATINGS_FILE) {
  let ratings;
  try {
    ratings = JSON.parse(readFileSync(file, "utf8"));
  } catch (cause) {
    throw new Error(`Could not read ${path.relative(process.cwd(), file)}: ${cause.message}`, {
      cause,
    });
  }

  const name = path.relative(process.cwd(), file);
  if (typeof ratings.fetched !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(ratings.fetched)) {
    throw new Error(`${name}: "fetched" must be a YYYY-MM-DD date`);
  }
  if (typeof ratings.problems !== "object" || ratings.problems === null) {
    throw new Error(`${name}: "problems" must be an object keyed by problem number`);
  }
  for (const [number, rating] of Object.entries(ratings.problems)) {
    const valid =
      rating === null ||
      (Number.isInteger(rating?.level) &&
        Number.isInteger(rating?.percent) &&
        rating.percent >= 0 &&
        rating.percent <= 100);
    if (!/^\d+$/.test(number) || !valid) {
      throw new Error(
        `${name}: problem ${JSON.stringify(number)} must map to { level, percent } or null, got ${JSON.stringify(rating)}`
      );
    }
  }

  return ratings;
}

/**
 * The ratings file as text: one line per problem, in problem order, so that
 * a refresh diffs cleanly.
 */
export function formatRatings({ fetched, problems }) {
  const rows = Object.keys(problems)
    .sort((a, b) => a - b)
    .map((number) => {
      const rating = problems[number];
      const value =
        rating === null ? "null" : `{ "level": ${rating.level}, "percent": ${rating.percent} }`;
      return `    "${number}": ${value}`;
    });
  return `{\n  "fetched": "${fetched}",\n  "problems": {\n${rows.join(",\n")}\n  }\n}\n`;
}

export function writeRatings(ratings, file = RATINGS_FILE) {
  writeFileSync(file, formatRatings(ratings));
}

/**
 * Problems with a post but no entry in the ratings file, which the table would
 * show without a difficulty bar.
 */
export function missingRatings(dir = POSTS_DIR, file = RATINGS_FILE) {
  const { problems } = loadRatings(file);
  return postedProblems(dir).filter((number) => !(number in problems));
}
