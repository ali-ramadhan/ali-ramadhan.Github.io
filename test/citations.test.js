import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCitep,
  formatCitet,
  parseCitationKeys,
  splitCitations,
} from "../config/citations.js";

test("parseCitationKeys splits keys on semicolons and takes a locator after the first comma", () => {
  assert.deepEqual(parseCitationKeys("freitag1973"), [{ key: "freitag1973", locator: "" }]);
  assert.deepEqual(parseCitationKeys("freitag1973; koshy2001, p. 86"), [
    { key: "freitag1973", locator: "" },
    { key: "koshy2001", locator: "p. 86" },
  ]);
  // Only the first comma separates the key, so a locator can have commas of its own
  assert.deepEqual(parseCitationKeys("koshy2001, pp. 86, 88"), [
    { key: "koshy2001", locator: "pp. 86, 88" },
  ]);
});

test("splitCitations keeps the text around each citation, in order, and whether it is textual", () => {
  assert.deepEqual(
    splitCitations("If $a < b$ & @citep[freitag1973] then @citet[koshy2001, p. 86]."),
    [
      { type: "text", content: "If $a < b$ & " },
      { type: "citation", textual: false, cites: [{ key: "freitag1973", locator: "" }] },
      { type: "text", content: " then " },
      { type: "citation", textual: true, cites: [{ key: "koshy2001", locator: "p. 86" }] },
      { type: "text", content: "." },
    ]
  );
});

test("splitCitations leaves text without a complete citation alone", () => {
  assert.deepEqual(splitCitations("no citations here"), [
    { type: "text", content: "no citations here" },
  ]);
  assert.deepEqual(splitCitations("an unclosed @citep[freitag1973"), [
    { type: "text", content: "an unclosed @citep[freitag1973" },
  ]);
  // The old [@key] syntax is plain text
  assert.deepEqual(splitCitations("[@freitag1973]"), [{ type: "text", content: "[@freitag1973]" }]);
  assert.deepEqual(splitCitations("@citep[freitag1973]@citet[koshy2001]"), [
    { type: "citation", textual: false, cites: [{ key: "freitag1973", locator: "" }] },
    { type: "citation", textual: true, cites: [{ key: "koshy2001", locator: "" }] },
  ]);
});

test("formatCitep and formatCitet show the authors and year in author-year style", () => {
  const ref = { authors: "Dickey, D. A., & Fuller, W. A.", year: 1979 };
  assert.equal(formatCitep(ref), "Dickey & Fuller, 1979");
  assert.equal(formatCitep(ref, "p. 428"), "Dickey & Fuller, 1979, p. 428");
  assert.equal(formatCitet(ref), "Dickey & Fuller (1979)");
  assert.equal(formatCitet(ref, "p. 428"), "Dickey & Fuller (1979, p. 428)");

  const single = { authors: "Koshy, Thomas", year: 2001 };
  assert.equal(formatCitep(single), "Koshy, 2001");
  assert.equal(formatCitet(single), "Koshy (2001)");

  // Three or more authors, with or without a comma before the "&"
  const three = { authors: "Ham, Y. G., Kim, J. H. & Luo, J. J.", year: 2019 };
  assert.equal(formatCitep(three), "Ham et al., 2019");
  assert.equal(formatCitet(three), "Ham et al. (2019)");
  const four = {
    authors: "Kwiatkowski, D., Phillips, P. C. B., Schmidt, P., Shin, Y.",
    year: 1992,
  };
  assert.equal(formatCitep(four), "Kwiatkowski et al., 1992");

  assert.equal(formatCitep(undefined), "[Unknown]");
  assert.equal(formatCitet(undefined), "[Unknown]");
});
