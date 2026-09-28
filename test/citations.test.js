import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCitation, parseCitationKeys, splitCitations } from "../config/citations.js";

test("parseCitationKeys splits keys on semicolons and takes a locator after the first comma", () => {
  assert.deepEqual(parseCitationKeys("@freitag1973"), [{ key: "freitag1973", locator: "" }]);
  assert.deepEqual(parseCitationKeys("@freitag1973; @koshy2001, p. 86"), [
    { key: "freitag1973", locator: "" },
    { key: "koshy2001", locator: "p. 86" },
  ]);
  // Only the first comma separates the key, so a locator can have commas of its own
  assert.deepEqual(parseCitationKeys("@koshy2001, pp. 86, 88"), [
    { key: "koshy2001", locator: "pp. 86, 88" },
  ]);
});

test("splitCitations keeps the text around each citation, in order", () => {
  assert.deepEqual(splitCitations("If $a < b$ & [@freitag1973] then [@koshy2001, p. 86]."), [
    { type: "text", content: "If $a < b$ & " },
    { type: "citation", cites: [{ key: "freitag1973", locator: "" }] },
    { type: "text", content: " then " },
    { type: "citation", cites: [{ key: "koshy2001", locator: "p. 86" }] },
    { type: "text", content: "." },
  ]);
});

test("splitCitations leaves text without a complete citation alone", () => {
  assert.deepEqual(splitCitations("no citations here"), [
    { type: "text", content: "no citations here" },
  ]);
  assert.deepEqual(splitCitations("an unclosed [@freitag1973"), [
    { type: "text", content: "an unclosed [@freitag1973" },
  ]);
  assert.deepEqual(splitCitations("[@freitag1973][@koshy2001]"), [
    { type: "citation", cites: [{ key: "freitag1973", locator: "" }] },
    { type: "citation", cites: [{ key: "koshy2001", locator: "" }] },
  ]);
});

test("formatCitation shows the first author and year, then any locator", () => {
  const ref = { authors: "Dickey, D. A., & Fuller, W. A.", year: 1979 };
  assert.equal(formatCitation(ref), "Dickey, 1979");
  assert.equal(formatCitation(ref, "p. 428"), "Dickey, 1979, p. 428");
  assert.equal(formatCitation(undefined), "[Unknown]");
});
