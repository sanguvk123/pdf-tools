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
  width?: number;
  hasEOL?: boolean;
}

interface Fragment {
  x: number;
  width: number;
  text: string;
}

/**
 * A horizontal gap wider than this, measured in points, is treated as a
 * column boundary rather than a word space. Roughly two characters at a
 * typical body size.
 */
const COLUMN_GAP_POINTS = 8;

/**
 * Joins one row's fragments, preserving wide horizontal gaps as double
 * spaces. The spreadsheet builder relies on those gaps to find columns, so
 * collapsing all whitespace here would silently merge every column together.
 */
function joinRow(fragments: Fragment[]): string {
  const sorted = [...fragments].sort((a, b) => a.x - b.x);

  let line = "";
  let cursor: number | null = null;

  for (const fragment of sorted) {
    if (cursor !== null) {
      const gap = fragment.x - cursor;
      if (gap >= COLUMN_GAP_POINTS) {
        line += "  ";
      } else if (gap > 0.5 && !line.endsWith(" ")) {
        line += " ";
      }
    }

    line += fragment.text;
    cursor = fragment.x + fragment.width;
  }

  // Collapse runs of three or more spaces to exactly two, so a single column
  // boundary never looks like several.
  return line.replace(/ {3,}/g, "  ").trim();
}

/** Groups text fragments into lines using their vertical position. */
function groupIntoLines(items: TextItemLike[]): string[] {
  const rows = new Map<number, Fragment[]>();

  for (const item of items) {
    const text = item.str ?? "";
    // Whitespace-only fragments carry no characters, but their position is
    // reconstructed from the gaps between neighbours, so they can be dropped.
    if (!text.trim()) continue;

    const transform = item.transform ?? [];
    const fragment: Fragment = {
      x: transform[4] ?? 0,
      width: item.width ?? 0,
      text,
    };

    // Round the baseline so fragments on the same visual line group together
    // despite sub-pixel differences.
    const row = Math.round(transform[5] ?? 0);
    const existing = rows.get(row);
    if (existing) {
      existing.push(fragment);
    } else {
      rows.set(row, [fragment]);
    }
  }

  return [...rows.entries()]
    // PDF y-coordinates grow upwards, so descending y is top-to-bottom.
    .sort((a, b) => b[0] - a[0])
    .map(([, fragments]) => joinRow(fragments))
    .filter((line) => line.length > 0);
}

export async function extractText(bytes: Uint8Array): Promise<ExtractedDocument> {
  // The legacy build is the one that runs under Node without a DOM. pdfjs-dist
  // is declared in serverExternalPackages, so this resolves as a real Node
  // module and pdf.js can load its own worker without bundler interference.
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
    throw new ToolError("CORRUPT_FILE", undefined, { cause: error });
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
