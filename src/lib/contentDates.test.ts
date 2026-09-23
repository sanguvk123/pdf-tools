import { describe, expect, it } from "vitest";
import {
  CONTENT_UPDATED,
  contentUpdated,
  sitemapPaths,
} from "@/lib/contentDates";

/**
 * The failure this guards against is silent: a hand-maintained date list drifts
 * out of sync with the routes as soon as someone adds a page and forgets, and
 * nothing about the site looks broken when it happens. The sitemap either omits
 * the page or claims a date nobody chose.
 */
describe("content dates", () => {
  it("records a date for every page in the sitemap", () => {
    const missing = sitemapPaths().filter((path) => !CONTENT_UPDATED[path]);

    expect(
      missing,
      `these routes have no entry in CONTENT_UPDATED: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("has no dates for pages that no longer exist", () => {
    const live = new Set(sitemapPaths());
    const orphaned = Object.keys(CONTENT_UPDATED).filter(
      (path) => !live.has(path),
    );

    // A leftover entry is harmless to the sitemap but means the list is being
    // maintained carelessly, which is how the missing-entry case starts.
    expect(
      orphaned,
      `these entries no longer match a route: ${orphaned.join(", ")}`,
    ).toEqual([]);
  });

  it("stores dates that parse, in YYYY-MM-DD form", () => {
    for (const [path, value] of Object.entries(CONTENT_UPDATED)) {
      expect(value, `${path} is not YYYY-MM-DD`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(
        Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()),
        `${path} has an unparseable date: ${value}`,
      ).toBe(false);
    }
  });

  it("does not claim a page was updated in the future", () => {
    // Tomorrow, to avoid a spurious failure from timezone skew on the runner.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    for (const [path, value] of Object.entries(CONTENT_UPDATED)) {
      expect(
        new Date(`${value}T00:00:00.000Z`).getTime(),
        `${path} is dated in the future: ${value}`,
      ).toBeLessThan(tomorrow.getTime());
    }
  });

  it("refuses to invent a date for an unknown page", () => {
    // The whole point of the module: falling back to today would quietly
    // restore the per-deploy churn it was written to remove.
    expect(() => contentUpdated("/not-a-real-page")).toThrow(
      /No content date recorded/,
    );
  });

  it("returns a stable date that does not depend on when it is called", () => {
    const first = contentUpdated("/compress-pdf");
    const second = contentUpdated("/compress-pdf");

    expect(first.toISOString()).toBe(second.toISOString());
    expect(first.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });
});
