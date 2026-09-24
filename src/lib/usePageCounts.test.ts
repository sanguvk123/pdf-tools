import { describe, expect, it } from "vitest";
import { looksLikePdf } from "@/lib/usePageCounts";

function fileNamed(name: string, type: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe("looksLikePdf", () => {
  it("accepts a PDF by MIME type", () => {
    expect(looksLikePdf(fileNamed("contract.pdf", "application/pdf"))).toBe(true);
  });

  it("accepts a PDF whose MIME type is missing", () => {
    // Files dragged from some sources — and from a few Linux file managers —
    // arrive with an empty type. Rejecting those would silently drop the page
    // count on a real PDF, so the extension is a fallback rather than a
    // second condition.
    expect(looksLikePdf(fileNamed("contract.pdf", ""))).toBe(true);
  });

  it("accepts an uppercase extension", () => {
    // Windows exports frequently produce .PDF.
    expect(looksLikePdf(fileNamed("SCAN.PDF", ""))).toBe(true);
  });

  it("rejects images, which have no page count to read", () => {
    // The image-to-PDF tools share this file list. Returning true here would
    // read every selected photo into memory just to have pdf-lib throw.
    expect(looksLikePdf(fileNamed("photo.jpg", "image/jpeg"))).toBe(false);
    expect(looksLikePdf(fileNamed("scan.png", "image/png"))).toBe(false);
  });

  it("rejects a name that merely contains pdf", () => {
    // "pdf-notes.txt" is not a PDF; only a trailing extension counts.
    expect(looksLikePdf(fileNamed("pdf-notes.txt", "text/plain"))).toBe(false);
  });
});
