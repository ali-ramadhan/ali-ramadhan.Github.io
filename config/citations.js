/**
 * Custom Citation Plugin for markdown-it
 * Handles [@key] and [@key1; @key2] syntax for citations
 */

import { readFileSync } from "fs";
import path from "path";
import yaml from "js-yaml";

// Store to track used citations per page
const pageCitations = new Map();

// Cache for loaded reference files
const referenceCache = new Map();

/**
 * Load references from a YAML file
 * @param {string} filename - The filename (without .yaml extension)
 * @returns {Object} - Parsed references object
 */
function loadReferences(filename) {
  if (referenceCache.has(filename)) {
    return referenceCache.get(filename);
  }

  try {
    const referencePath = path.join(process.cwd(), "_data", "references", `${filename}.yaml`);
    const referenceData = yaml.load(readFileSync(referencePath, "utf8"));
    referenceCache.set(filename, referenceData);
    return referenceData;
  } catch (error) {
    console.warn(`Error loading reference file ${filename}.yaml:`, error.message);
    return {};
  }
}

/**
 * Format a single reference for display
 * @param {Object} ref - Reference object
 * @param {string} key - Reference key
 * @returns {string} - Formatted reference
 */
function formatReference(ref, key) {
  if (!ref) return `[Unknown reference: ${key}]`;

  const authors = ref.authors || "Unknown Author";
  const year = ref.year || "Unknown Year";
  const title = ref.title || "Untitled";

  let formatted = `<div id="${key}" class="reference">
    <span class="ref-author-list">${authors} (${year}).</span>
    <i>${title}</i>`;

  if (ref.type === "article" && ref.journal) {
    formatted += `. <i>${ref.journal}</i>`;
    if (ref.volume) formatted += ` <b>${ref.volume}</b>`;
    if (ref.issue) formatted += `(${ref.issue})`;
    if (ref.pages) formatted += `, ${ref.pages}`;
  } else if (ref.type === "book") {
    if (ref.edition) formatted += `. ${ref.edition}`;
    if (ref.publisher) formatted += `. ${ref.publisher}`;
    if (ref.pages) formatted += `. ${ref.pages}`;
  } else if (ref.type === "chapter") {
    formatted += `. In <i>${ref.book_title}</i>`;
    if (ref.editors) formatted += `, ed. ${ref.editors}`;
    if (ref.pages) formatted += `, ${ref.pages}`;
    if (ref.publisher) formatted += `. ${ref.publisher}`;
  } else if (ref.type === "report") {
    if (ref.series) formatted += `. ${ref.series}`;
    if (ref.institution) formatted += `, ${ref.institution}`;
  } else if (ref.type === "preprint") {
    if (ref.arxiv) formatted += `. ${ref.arxiv}`;
    else if (ref.journal) formatted += `. <i>${ref.journal}</i>`;
  }

  formatted += ".";

  // Add links
  const links = [];
  if (ref.doi) links.push(`<a href="${ref.doi}" target="_blank">doi</a>`);
  if (ref.url) links.push(`<a href="${ref.url}" target="_blank">url</a>`);
  if (ref.pdf) links.push(`<a href="${ref.pdf}" target="_blank">pdf</a>`);
  if (ref.source) links.push(`<a href="${ref.source}" target="_blank">source</a>`);

  if (links.length > 0) {
    formatted += ` ${links.join(" ")}`;
  }

  formatted += "\n</div>";
  return formatted;
}

// Matches [@key], [@key1; @key2], and [@key, p. 86]
const citationRegex = /\[@([^\]]+)\]/g;

/**
 * Parse the inside of a citation, e.g. "@freitag1973; @koshy2001, p. 86", into
 * keys, each with an optional locator (whatever follows the key's first comma)
 * @param {string} keysString - The text between "[" and "]"
 * @returns {{key: string, locator: string}[]}
 */
export function parseCitationKeys(keysString) {
  return keysString.split(";").map((part) => {
    const [key, ...locator] = part.trim().replace(/^@/, "").split(",");
    return { key: key.trim(), locator: locator.join(",").trim() };
  });
}

/**
 * Split text into its plain-text pieces and its citations, in order
 * @param {string} text - Text that may contain citations
 * @returns {Array<{type: "text", content: string} | {type: "citation", cites: {key: string, locator: string}[]}>}
 */
export function splitCitations(text) {
  const pieces = [];
  let last = 0;
  for (const match of text.matchAll(citationRegex)) {
    if (match.index > last) pieces.push({ type: "text", content: text.slice(last, match.index) });
    pieces.push({ type: "citation", cites: parseCitationKeys(match[1]) });
    last = match.index + match[0].length;
  }
  if (last < text.length) pieces.push({ type: "text", content: text.slice(last) });
  return pieces;
}

/**
 * Format citation display text
 * @param {Object} ref - Reference object
 * @param {string} [locator] - Optional locator such as "p. 86"
 * @returns {string} - Formatted citation display
 */
export function formatCitation(ref, locator = "") {
  if (!ref) return "[Unknown]";

  const authors = ref.authors || "Unknown";
  const year = ref.year || "Unknown";

  // Simple author formatting - just take first author if multiple
  const firstAuthor = authors.split(",")[0].split(" & ")[0];

  return locator ? `${firstAuthor}, ${year}, ${locator}` : `${firstAuthor}, ${year}`;
}

/**
 * Custom markdown-it plugin for citations
 */
export function markdownItCitations(md, options = {}) {
  const defaultOptions = {
    defaultReferenceFile: "references",
    citationClass: "citation",
    tooltipClass: "citation-tooltip",
    ...options,
  };

  // Bibliography marker regex to match [[bibliography]] or [[bibliography:filename]]
  const bibliographyRegex = /^\[\[bibliography(?::([^\]]+))?\]\]/gm;

  md.core.ruler.after("inline", "citations", function (state) {
    const pageUrl = state.env.page?.url || "default";

    if (!pageCitations.has(pageUrl)) {
      pageCitations.set(pageUrl, new Set());
    }

    const usedCitations = pageCitations.get(pageUrl);
    const referenceFile = state.env.referenceFile || defaultOptions.defaultReferenceFile;

    // One parenthesized group of citation links, e.g. "(Freitag, 1973; Koshy, 2001, p. 86)"
    function renderCitation(cites) {
      const references = loadReferences(referenceFile);

      const citationParts = cites.map(({ key, locator }) => {
        const ref = references[key];
        if (!ref) {
          console.warn(`Citation key "${key}" not found in ${referenceFile}.yaml`);
          return `<span class="citation-missing">[${key}]</span>`;
        }

        usedCitations.add(key);
        const tooltipData = JSON.stringify({
          title: ref.title,
          authors: ref.authors,
          year: ref.year,
          journal: ref.journal || ref.publisher || "",
          doi: ref.doi || ref.url || "",
        }).replace(/'/g, "&#39;");

        return `<a href="#${key}" class="${defaultOptions.citationClass}" data-tooltip='${tooltipData}'>${formatCitation(ref, locator)}</a>`;
      });

      return `(${citationParts.join("; ")})`;
    }

    for (const token of state.tokens) {
      if (token.type !== "inline" || !token.children) continue;

      // Split each text token around its citations rather than turning it all
      // into HTML. The text in between stays text, so markdown-it still escapes
      // it and later rules (like the @benchmark shortcodes) still process it.
      token.children = token.children.flatMap((child) => {
        if (child.type !== "text" || !child.content.includes("[@")) return [child];

        return splitCitations(child.content).map((piece) => {
          const isText = piece.type === "text";
          const pieceToken = new state.Token(isText ? "text" : "html_inline", "", 0);
          pieceToken.content = isText ? piece.content : renderCitation(piece.cites);
          pieceToken.level = child.level;
          return pieceToken;
        });
      });
    }

    return false;
  });

  // Bibliography marker processing
  md.core.ruler.after("citations", "bibliography", function (state) {
    const pageUrl = state.env.page?.url || "default";

    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];

      if (token.type === "paragraph_open") {
        const nextToken = state.tokens[i + 1];
        if (nextToken && nextToken.type === "inline" && nextToken.children) {
          for (let j = 0; j < nextToken.children.length; j++) {
            const child = nextToken.children[j];

            if (child.type === "text" && bibliographyRegex.test(child.content)) {
              bibliographyRegex.lastIndex = 0; // Reset regex
              const match = bibliographyRegex.exec(child.content);

              if (match) {
                // Extract reference file from marker or use default
                const referenceFile =
                  match[1] || state.env.referenceFile || defaultOptions.defaultReferenceFile;

                // Generate bibliography using the stored citations for this page
                const usedCitations = pageCitations.get(pageUrl);
                let bibliography = "";

                if (usedCitations && usedCitations.size > 0) {
                  const references = loadReferences(referenceFile);
                  const sortedKeys = Array.from(usedCitations).sort();

                  bibliography = '<div class="references">\n';
                  for (const key of sortedKeys) {
                    const ref = references[key];
                    if (ref) {
                      bibliography += formatReference(ref, key) + "\n";
                    }
                  }
                  bibliography += "</div>";
                }

                // Replace the paragraph tokens with HTML token
                const htmlToken = new state.Token("html_block", "", 0);
                htmlToken.content = bibliography;
                htmlToken.level = token.level;

                // Replace paragraph_open, inline, and paragraph_close tokens with HTML
                state.tokens.splice(i, 3, htmlToken);

                // Reset regex for safety
                bibliographyRegex.lastIndex = 0;
                break;
              }
            }
          }
        }
      }
    }

    return false;
  });

  // Store references in state for later use in bibliography generation
  md.renderer.rules.citations = function () {
    return "";
  };
}

/**
 * Generate bibliography HTML for used citations
 * @param {string} pageUrl - Page URL to get citations for
 * @param {string} referenceFile - Reference file name (without .yaml)
 * @returns {string} - HTML bibliography
 */
export function generateBibliography(pageUrl, referenceFile = "references") {
  const usedCitations = pageCitations.get(pageUrl);

  // If no citations collected from markdown processing, return empty
  if (!usedCitations || usedCitations.size === 0) {
    return "";
  }

  const references = loadReferences(referenceFile);
  const sortedKeys = Array.from(usedCitations).sort();

  let bibliography = '<div class="references">\n';

  for (const key of sortedKeys) {
    const ref = references[key];
    if (ref) {
      bibliography += formatReference(ref, key) + "\n";
    } else {
      console.warn(`Reference not found: ${key}`);
    }
  }

  bibliography += "</div>";

  return bibliography;
}

/**
 * Generate bibliography by scanning HTML content for citations
 * @param {string} htmlContent - HTML content to scan for citations
 * @param {string} referenceFile - Reference file name (without .yaml)
 * @returns {string} - HTML bibliography
 */
export function generateBibliographyFromContent(htmlContent, referenceFile = "references") {
  // Extract citation keys from citation links (both orders: href first or class first)
  const citationRegex =
    /(?:href="#([^"]+)"[^>]*class="citation"|class="citation"[^>]*href="#([^"]+)")/g;
  const citationKeys = new Set();

  let match;
  while ((match = citationRegex.exec(htmlContent)) !== null) {
    // match[1] is for href-first pattern, match[2] is for class-first pattern
    const key = match[1] || match[2];
    citationKeys.add(key);
  }

  if (citationKeys.size === 0) {
    return "";
  }

  const references = loadReferences(referenceFile);
  const sortedKeys = Array.from(citationKeys).sort();

  let bibliography = '<div class="references">\n';

  for (const key of sortedKeys) {
    const ref = references[key];
    if (ref) {
      bibliography += formatReference(ref, key) + "\n";
    } else {
      console.warn(`Reference not found: ${key}`);
    }
  }

  bibliography += "</div>";

  return bibliography;
}

/**
 * Clear all module-level citation caches. Wired to Eleventy's
 * `eleventy.before` event so watch-mode rebuilds pick up reference-file
 * edits and drop citations removed from posts.
 */
export function clearCitationCaches() {
  pageCitations.clear();
  referenceCache.clear();
}
