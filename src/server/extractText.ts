import "server-only";
import { existsSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
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
 * Absolute paths to the pdf.js runtime assets.
 *
 * pdf.js reaches for its worker and font files through a dynamic import and a
 * fetch that no bundler can trace statically. Locally that is invisible
 * because the files sit in node_modules; in a serverless bundle only traced
 * files are deployed, so the worker is absent and every document fails to
 * open — reported, misleadingly, as a corrupt upload.
 *
 * Deliberately NOT using require.resolve: under Turbopack that call is
 * rewritten to return a numeric module id rather than a path, so it produced
 *   TypeError: The "path" argument must be of type string. Received type
 *   number (83004)
 * in production while working perfectly on a dev machine. Walking the
 * filesystem is uninteresting but it behaves identically in both places.
 */
function pdfjsAssetPaths(): {
  workerSrc: string;
  standardFontDataUrl: string;
} | null {
  const roots = [process.cwd(), dirname(fileURLToPath(import.meta.url))];

  for (const root of roots) {
    // Walk upwards looking for the installed package, which in a lambda sits
    // above the bundled chunk rather than beside it.
    let dir = root;
    for (let depth = 0; depth < 8; depth++) {
      const packageDir = join(dir, "node_modules", "pdfjs-dist");
      const workerSrc = join(packageDir, "legacy", "build", "pdf.worker.mjs");

      if (existsSync(workerSrc)) {
        return {
          workerSrc,
          // pdf.js expects a directory, with the trailing separator.
          standardFontDataUrl: join(packageDir, "standard_fonts") + sep,
        };
      }

      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  // Fall back to pdf.js's own defaults rather than throwing: a wrong path is
  // worse than none, and a genuine parse failure still surfaces normally.
  return null;
}

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
  // module rather than being bundled.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Without an explicit path pdf.js falls back to "./pdf.worker.mjs" relative
  // to its own module, which does not survive bundling. Null means the assets
  // could not be located, in which case pdf.js keeps its own defaults.
  const assets = pdfjsAssetPaths();
  if (assets) {
    pdfjs.GlobalWorkerOptions.workerSrc = assets.workerSrc;
  }

  let pdf;
  try {
    pdf = await pdfjs.getDocument({
      data: bytes,
      isEvalSupported: false,
      useSystemFonts: true,
      ...(assets
        ? { standardFontDataUrl: assets.standardFontDataUrl }
        : undefined),
      // Fetch-based loading assumes a URL that does not exist server-side;
      // read the font files from disk instead.
      useWorkerFetch: false,
    }).promise;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") throw new ToolError("PASSWORD_REQUIRED");
    // Keep the underlying error as the cause: the route logs it, which is the
    // only way an environment-specific failure like a missing worker file is
    // distinguishable from a genuinely damaged upload.
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
