#!/usr/bin/env node
/**
 * Refresh the Project Euler difficulty ratings
 *
 *   npm run pe:difficulty
 *
 * Fetches the current rating of every problem that has a post from its page on
 * projecteuler.net and rewrites _data/project-euler/difficulty.json. Ratings
 * drift as more people solve the problems, so run this every now and then, and
 * after writing up a new problem. Nothing is written if any fetch fails.
 */

import { existsSync } from "fs";
import path from "path";
import {
  RATINGS_FILE,
  fetchRating,
  loadRatings,
  postedProblems,
  writeRatings,
} from "../config/pe-difficulty.js";

// Pause between requests; there is no hurry and no need to hammer the site
const DELAY_MS = 500;

const previous = existsSync(RATINGS_FILE) ? loadRatings().problems : {};
const problems = {};
const counts = { new: 0, changed: 0, unchanged: 0 };

const numbers = postedProblems();
for (const [i, number] of numbers.entries()) {
  let rating;
  try {
    rating = await fetchRating(number);
  } catch (error) {
    console.error(`Problem ${number}: ${error.message}`);
    process.exit(1);
  }
  problems[number] = rating;

  const before = previous[number];
  if (before === undefined) {
    counts.new += 1;
    console.log(`Problem ${number}: ${describe(rating)} (new)`);
  } else if (before?.percent !== rating?.percent || before?.level !== rating?.level) {
    counts.changed += 1;
    console.log(`Problem ${number}: ${describe(before)} → ${describe(rating)}`);
  } else {
    counts.unchanged += 1;
  }

  if (i < numbers.length - 1) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
}

const fetched = new Date().toISOString().slice(0, 10);
writeRatings({ fetched, problems });
console.log(
  `${numbers.length} problems (${counts.new} new, ${counts.changed} changed, ` +
    `${counts.unchanged} unchanged) → ${path.relative(process.cwd(), RATINGS_FILE)}`
);

function describe(rating) {
  return rating ? `${rating.percent}% (level ${rating.level})` : "not rated yet";
}
