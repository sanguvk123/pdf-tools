import { describe, expect, it } from "vitest";
import { searchTools } from "@/lib/toolSearch";

/**
 * These cases are the specification, not a sample of it.
 *
 * Nobody types "extract-pages-pdf". They type "remove pages" or "make pdf
 * smaller", and a search that only matches tool names fails every one of
 * those while still looking like it works when you test it with "merge".
 */

function topSlug(query: string): string | undefined {
  return searchTools(query)[0]?.slug;
}

describe("searchTools", () => {
  describe("matches how people actually phrase the task", () => {
    const cases: [query: string, slug: string][] = [
      ["make pdf smaller", "compress-pdf"],
      ["reduce file size", "compress-pdf"],
      ["shrink pdf", "compress-pdf"],
      ["convert pdf to word", "pdf-to-word"],
      ["pdf to doc", "pdf-to-word"],
      ["editable document", "pdf-to-word"],
      ["remove pages", "delete-pages-pdf"],
      ["delete a page", "delete-pages-pdf"],
      ["combine files", "merge-pdf"],
      ["join pdfs", "merge-pdf"],
      ["put pdfs together", "merge-pdf"],
      ["separate pages", "split-pdf"],
      ["turn pages sideways", "rotate-pdf"],
      ["pdf to picture", "pdf-to-jpg"],
      ["photo to pdf", "jpg-to-pdf"],
      ["spreadsheet", "pdf-to-excel"],
      ["copy text out of pdf", "pdf-to-text"],
      ["rearrange pages", "reorder-pdf-pages"],
    ];

    for (const [query, slug] of cases) {
      it(`"${query}" finds ${slug}`, () => {
        expect(topSlug(query)).toBe(slug);
      });
    }
  });

  it("matches the tool name directly", () => {
    expect(topSlug("merge pdf")).toBe("merge-pdf");
    expect(topSlug("compress")).toBe("compress-pdf");
  });

  it("ignores case, extra whitespace and punctuation", () => {
    expect(topSlug("  MERGE   PDF!  ")).toBe("merge-pdf");
    expect(topSlug("PDF → Word")).toBe("pdf-to-word");
  });

  it("tolerates a typo in the middle of a word", () => {
    // Someone typing quickly should still land on the tool rather than an
    // empty state that makes the site look broken.
    expect(topSlug("compres pdf")).toBe("compress-pdf");
    expect(topSlug("mrege pdf")).toBe("merge-pdf");
  });

  it("returns nothing for a query with no plausible match", () => {
    // An empty result is correct here. Showing an arbitrary tool because the
    // ranking never returns zero is worse than admitting there is no match.
    expect(searchTools("book a flight to paris")).toEqual([]);
    expect(searchTools("xyzzy")).toEqual([]);
  });

  it("returns nothing for an empty or whitespace query", () => {
    expect(searchTools("")).toEqual([]);
    expect(searchTools("   ")).toEqual([]);
  });

  it("does not match a keyword phrase that is only a substring", () => {
    // "remove pages" contains the literal characters of "move pages", a
    // keyword for the page reorderer. Matching phrases with includes() ranked
    // Reorder above Delete for a query that means the opposite. Word
    // boundaries are what make this correct, so this guards the comparison
    // rather than the ranking.
    expect(topSlug("remove pages")).toBe("delete-pages-pdf");
    expect(topSlug("move pages")).toBe("reorder-pdf-pages");
  });

  it("ranks an exact name above an incidental keyword mention", () => {
    const results = searchTools("split");
    expect(results[0]?.slug).toBe("split-pdf");
  });

  it("caps the number of results so the menu stays scannable", () => {
    // "pdf" appears in virtually every tool; without a cap this dumps the
    // entire catalogue into a dropdown.
    expect(searchTools("pdf").length).toBeLessThanOrEqual(6);
  });

  it("never returns duplicates", () => {
    // A tool matching on both its name and a keyword must still appear once.
    const results = searchTools("compress pdf");
    const slugs = results.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
