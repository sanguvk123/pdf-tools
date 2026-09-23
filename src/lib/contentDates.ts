/**
 * When each page's content last meaningfully changed.
 *
 * The sitemap previously stamped `new Date()` on all 26 URLs at build time, so
 * every deploy told Google that every page had just changed — including pages
 * the deploy never touched. Google treats `lastmod` as a hint and learns to
 * discount a sitemap that always claims everything is fresh, so the signal was
 * not just useless but actively self-devaluing.
 *
 * These are hand-maintained rather than derived, for two reasons:
 *
 *   1. Git dates are the obvious alternative and are wrong here. Page copy
 *      lives in the shared registry (tools.ts), so a one-word fix to a single
 *      FAQ would bump the commit date of the file backing all 15 tool pages —
 *      reproducing the exact bug this replaces. Vercel also builds from a
 *      shallow clone, where per-file history may not be present at all.
 *   2. A file mtime is worse still: checkouts and CI runners set it to the
 *      moment of clone, so it tracks the build, not the content.
 *
 * The cost is that this list must be updated by hand, which is why
 * contentDates.test.ts fails if a route is missing or malformed rather than
 * letting it fall back to something plausible but false.
 */

import { TOOLS } from "@/lib/tools";
import { COMPRESS_INTENTS } from "@/lib/compressIntents";
import { COMPRESS_TARGETS } from "@/lib/compressTargets";

/**
 * Date-only (YYYY-MM-DD) is deliberate. A wall-clock time implies a precision
 * we do not have about when copy changed, and the crawl scheduling this feeds
 * has no use for it.
 */
export type ContentDate = `${number}-${number}-${number}`;

/**
 * Keyed by pathname exactly as it appears in the sitemap, so a mismatch is a
 * visible key error rather than a silently wrong date.
 */
export const CONTENT_UPDATED: Record<string, ContentDate> = {
  "/": "2026-09-23",
  "/pdf-tools": "2026-09-23",

  // Tools.
  "/merge-pdf": "2026-09-23",
  "/split-pdf": "2026-09-23",
  "/compress-pdf": "2026-09-23",
  "/rotate-pdf": "2026-09-23",
  "/delete-pages-pdf": "2026-09-23",
  "/extract-pages-pdf": "2026-09-23",
  "/reorder-pdf-pages": "2026-09-23",
  "/jpg-to-pdf": "2026-09-23",
  "/png-to-pdf": "2026-09-23",
  "/image-to-pdf": "2026-09-23",
  "/pdf-to-jpg": "2026-09-23",
  "/pdf-to-png": "2026-09-23",
  "/pdf-to-word": "2026-09-23",
  "/pdf-to-text": "2026-09-23",
  "/pdf-to-excel": "2026-09-23",

  // Size-target compression pages.
  "/compress-pdf-to-5mb": "2026-09-23",
  "/compress-pdf-to-2mb": "2026-09-23",
  "/compress-pdf-to-1mb": "2026-09-23",
  "/compress-pdf-to-500kb": "2026-09-23",
  "/compress-pdf-to-200kb": "2026-09-23",
  "/compress-pdf-to-100kb": "2026-09-23",

  // Intent-based compression pages.
  "/compress-large-pdf": "2026-09-23",
  "/reduce-pdf-size": "2026-09-23",
  "/compress-pdf-without-losing-quality": "2026-09-23",
};

/**
 * Every pathname the sitemap is expected to cover, derived from the same
 * registries the sitemap itself iterates. Kept here so the test can compare
 * the two without importing the sitemap's rendering concerns.
 */
export function sitemapPaths(): string[] {
  return [
    "/",
    "/pdf-tools",
    ...TOOLS.map((tool) => `/${tool.slug}`),
    ...COMPRESS_TARGETS.map((target) => `/compress-pdf-to-${target.slug}`),
    ...COMPRESS_INTENTS.map((intent) => `/${intent.slug}`),
  ];
}

/**
 * Throws rather than defaulting to today. A missing entry means a new page was
 * added without recording when its content was written, and inventing a date
 * would quietly reintroduce the churn this module exists to remove — the build
 * should stop instead.
 */
export function contentUpdated(path: string): Date {
  const recorded = CONTENT_UPDATED[path];

  if (!recorded) {
    throw new Error(
      `No content date recorded for "${path}". Add it to CONTENT_UPDATED in src/lib/contentDates.ts.`,
    );
  }

  // Parsed as UTC midnight; a bare YYYY-MM-DD is already treated as UTC by
  // Date, so this stays stable regardless of the build machine's timezone.
  return new Date(`${recorded}T00:00:00.000Z`);
}
