import "server-only";
import { ToolError } from "@/lib/errors";

/**
 * Server-side PDF text extraction.
 *
 * Conversion to Word and Excel runs on the server because it needs the full
 * pdf.js text layer and produces document formats we would rather not ship to
 * every browser. The frontend is unaware of the distinction.
 */

export interface ExtractedPage {
  pageNumber: number;
  /** Lines in reading order. Empty for a scanned page. */
  lines: string[];
}

export interface ExtractedDocument {
  pages: ExtractedPage[];
  /** Pages that contained no selectable text, i.e. scans. */
  emptyPageCount: number;
}

interface TextItemLike {
  str?: string;
  transform?: number[];
  hasEOL?: boolean;
}

/** Groups text fragments into lines using their vertical position. */
function groupIntoLines(items: TextItemLike[]): string[] {
  const rows = new Map<number, { x: number; text: string }[]>();

  for (const item of items) {
    const text = item.str ?? "";
    if (!text.trim()) continue;

    const transform = item.transform ?? [];
    const x = transform[4] ?? 0;
    const y = transform[5] ?? 0;

    // Round the baseline so fragments on the same visual line group together
    // despite sub-pixel differences.
    const row = Math.round(y);
    const existing = rows.get(row);
    if (existing) {
      existing.push({ x, text });
    } else {
      rows.set(row, [{ x, text }]);
    }
  }

  return [...rows.entries()]
    // PDF y-coordinates grow upwards, so descending y is top-to-bottom.
    .sort((a, b) => b[0] - a[0])
    .map(([, fragments]) =>
      fragments
        .sort((a, b) => a.x - b.x)
        .map((fragment) => fragment.text)
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length > 0);
}

export async function extractText(bytes: Uint8Array): Promise<ExtractedDocument> {
  // The legacy build is the one that runs under Node without a DOM.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  let pdf;
  try {
    pdf = await pdfjs.getDocument({
      data: bytes,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") throw new ToolError("PASSWORD_REQUIRED");
    throw new ToolError("CORRUPT_FILE");
  }

  const pages: ExtractedPage[] = [];
  let emptyPageCount = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = groupIntoLines(content.items as TextItemLike[]);

    if (lines.length === 0) emptyPageCount += 1;
    pages.push({ pageNumber, lines });

    page.cleanup();
  }

  await pdf.destroy();

  if (pages.length > 0 && emptyPageCount === pages.length) {
    throw new ToolError("NO_TEXT_CONTENT");
  }

  return { pages, emptyPageCount };
}
