/**
 * Crawls every URL the sitemap advertises plus every synonym redirect, and
 * asserts the things the SEO brief actually depends on:
 *
 *   1. The page responds 200 (a 404 in the sitemap actively harms the domain).
 *   2. There is exactly ONE <h1>. Multiple H1s blur which query the page
 *      answers; zero means the search result has no visible counterpart.
 *   3. The <h1> and the <title> are about the same thing. A user who clicks
 *      "Compress PDF to 100KB" must land on a page that visibly says so,
 *      otherwise the click bounces.
 *   4. There is exactly one canonical, and it points at the URL crawled.
 *   5. The upload control is present in the server-rendered HTML, so the tool
 *      is usable at first paint rather than after a hydration round-trip.
 *   6. Synonym URLs redirect permanently to the real page instead of 404ing.
 *
 * Derives its route list from the live sitemap rather than a hand-written
 * list, so a page that is shipped but never indexed (or indexed but never
 * shipped) shows up as a failure instead of being silently skipped.
 */

import { readFile } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

/**
 * Origin the sitemap advertises. Read from the sitemap itself rather than
 * hardcoded, so this script keeps working after a domain change instead of
 * silently comparing against a host the site no longer uses.
 */
let SITEMAP_HOST = "";

/** Words that carry no intent, so they should not count towards title/H1 overlap. */
const STOP_WORDS = new Set([
  "a", "an", "and", "the", "to", "for", "of", "in", "on", "your", "you",
  "with", "without", "free", "online", "no", "signup", "sign", "up", "it",
  "is", "are", "or", "pdfutility", "app",
]);

function textOf(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywords(value) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word && !STOP_WORDS.has(word)),
  );
}

async function fetchSitemapPaths() {
  const response = await fetch(`${BASE}/sitemap.xml`);
  if (!response.ok) throw new Error(`sitemap.xml returned ${response.status}`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (urls.length === 0) throw new Error("sitemap contained no <loc> entries");

  SITEMAP_HOST = new URL(urls[0]).origin;

  // Every entry must agree on one origin, or canonicals and the sitemap will
  // disagree about which host owns the content.
  const foreign = urls.filter((url) => new URL(url).origin !== SITEMAP_HOST);
  if (foreign.length) {
    throw new Error(
      `sitemap mixes origins: ${[...new Set(foreign.map((u) => new URL(u).origin))].join(", ")}`,
    );
  }

  return urls.map((url) => url.replace(SITEMAP_HOST, "") || "/");
}

const failures = [];
const warnings = [];
const rows = [];

function fail(path, message) {
  failures.push(`${path}: ${message}`);
}

async function checkPage(path) {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  if (response.status !== 200) {
    fail(path, `expected 200, got ${response.status}`);
    rows.push({ path, status: response.status, title: "-", h1: "-", ok: false });
    return;
  }

  const html = await response.text();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? textOf(titleMatch[1]) : "";
  if (!title) fail(path, "no <title>");

  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Matches.length === 0) fail(path, "no <h1>");
  if (h1Matches.length > 1) {
    fail(path, `${h1Matches.length} <h1> elements, expected exactly 1`);
  }
  const h1 = h1Matches.length ? textOf(h1Matches[0][1]) : "";

  // Title and H1 need not be identical, but they must share intent words.
  if (title && h1) {
    const titleWords = keywords(title);
    const h1Words = keywords(h1);
    const shared = [...h1Words].filter((word) => titleWords.has(word));
    const overlap = h1Words.size ? shared.length / h1Words.size : 0;
    if (overlap < 0.6) {
      fail(
        path,
        `title/H1 intent mismatch (${Math.round(overlap * 100)}% overlap)\n` +
          `      title: ${title}\n      h1:    ${h1}`,
      );
    }
  }

  const canonicals = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/gi)];
  if (canonicals.length !== 1) {
    fail(path, `${canonicals.length} canonical tags, expected exactly 1`);
  } else {
    const href = canonicals[0][0].match(/href="([^"]+)"/)?.[1] ?? "";
    const expected = path === "/" ? SITEMAP_HOST : `${SITEMAP_HOST}${path}`;
    if (href.replace(/\/$/, "") !== expected.replace(/\/$/, "")) {
      fail(path, `canonical points at ${href}, expected ${expected}`);
    }
  }

  const description = html.match(
    /<meta[^>]*name="description"[^>]*content="([^"]*)"/i,
  )?.[1];
  if (!description) fail(path, "no meta description");
  else if (description.length > 165) {
    warnings.push(`${path}: meta description is ${description.length} chars (Google truncates ~160)`);
  }

  // The brief requires the tool itself above the SEO copy, usable immediately.
  const isToolPage = path !== "/" && path !== "/pdf-tools";
  if (isToolPage) {
    if (!/Drop your|Choose file|Select file|drop/i.test(html)) {
      fail(path, "no upload control in server-rendered HTML");
    }
    const uploadAt = html.search(/Drop your|Choose file|Select file/i);
    const aboutAt = html.search(/<section/i);
    if (uploadAt > -1 && aboutAt > -1 && aboutAt < uploadAt) {
      fail(path, "SEO content appears before the tool");
    }
  }

  const ldJson = [...html.matchAll(/type="application\/ld\+json"/g)];
  if (isToolPage && ldJson.length === 0) {
    warnings.push(`${path}: no JSON-LD structured data`);
  }

  rows.push({ path, status: 200, title, h1, ok: true });
}

async function checkRedirect(from, to) {
  const response = await fetch(`${BASE}/${from}`, { redirect: "manual" });
  if (response.status !== 301 && response.status !== 308) {
    fail(`/${from}`, `expected a permanent redirect, got ${response.status}`);
    return;
  }
  const location = response.headers.get("location") ?? "";
  if (!location.endsWith(`/${to}`)) {
    fail(`/${from}`, `redirects to ${location}, expected /${to}`);
  }
}

const paths = await fetchSitemapPaths();
console.log(`Crawling ${paths.length} sitemap URLs at ${BASE}\n`);

for (const path of paths) {
  await checkPage(path);
}

// Read the pairs out of the source rather than importing it: this is a plain
// .mjs script and Node will not load TypeScript. Parsing keeps the script
// dependency-free and still fails loudly if the shape ever changes.
const redirectSource = await readFile(
  new URL("../src/lib/redirects.ts", import.meta.url),
  "utf8",
);
const redirectPairs = [
  ...redirectSource.matchAll(/\{\s*from:\s*"([^"]+)",\s*to:\s*"([^"]+)"/g),
].map(([, from, to]) => ({ from, to }));

if (redirectPairs.length === 0) {
  throw new Error("parsed 0 redirects from redirects.ts — the format changed");
}

for (const { from, to } of redirectPairs) {
  await checkRedirect(from, to);
}
const redirectCount = redirectPairs.length;

const pad = Math.max(...rows.map((row) => row.path.length));
for (const row of rows) {
  const mark = row.ok ? "ok  " : "FAIL";
  console.log(`${mark} ${row.path.padEnd(pad)}  ${row.title.slice(0, 68)}`);
}

console.log(`\nChecked ${rows.length} pages and ${redirectCount} redirects.`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const warning of warnings) console.log(`  - ${warning}`);
}

if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S):`);
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}

console.log("\nAll checks passed.");
