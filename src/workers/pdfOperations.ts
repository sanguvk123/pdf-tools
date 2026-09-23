import { PDFDocument, degrees } from "pdf-lib";
import { ToolError } from "@/lib/errors";
import { outputName, stripExtension } from "@/lib/format";
import type { ToolOutput, ToolProgress } from "@/lib/types";

/**
 * Pure PDF operations, executed inside a Web Worker so the main thread stays
 * responsive. Nothing here touches the DOM.
 */

export interface OperationContext {
  report: (progress: ToolProgress) => void;
  /** Throws if the user cancelled, checked between pages. */
  throwIfCancelled: () => void;
  password?: string;
}

export interface OperationResult {
  outputs: ToolOutput[];
  note?: string;
}

/** Wraps pdf-lib load failures in our own error vocabulary. */
async function loadPdf(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer();

  try {
    // ignoreEncryption lets us open documents with owner-password-only
    // restrictions, which are common and perfectly readable.
    return await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/encrypt/i.test(message)) throw new ToolError("PASSWORD_REQUIRED");
    throw new ToolError("CORRUPT_FILE");
  }
}

function toBlob(bytes: Uint8Array): Blob {
  // Copy into a fresh buffer so the Blob owns plain ArrayBuffer-backed bytes.
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

/* ---------------- Merge ---------------- */

export async function mergePdfs(
  files: File[],
  context: OperationContext,
): Promise<OperationResult> {
  if (files.length < 2) {
    throw new ToolError(
      "NO_FILES",
      "Add at least two PDFs to merge them together.",
    );
  }

  const merged = await PDFDocument.create();

  for (let index = 0; index < files.length; index++) {
    context.throwIfCancelled();
    context.report({
      stage: `Adding ${files[index].name}`,
      ratio: index / files.length,
    });

    const source = await loadPdf(files[index]);
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }

  context.report({ stage: "Saving", ratio: 1 });
  const bytes = await merged.save();

  return {
    outputs: [{ filename: "merged.pdf", blob: toBlob(bytes) }],
  };
}

/* ---------------- Split ---------------- */

export type SplitMode = "extract" | "every-page" | "ranges";

export async function splitPdf(
  file: File,
  options: { mode: SplitMode; pages: number[]; ranges: string },
  context: OperationContext,
): Promise<OperationResult> {
  const source = await loadPdf(file);
  const pageCount = source.getPageCount();
  const base = stripExtension(file.name);

  if (options.mode === "every-page") {
    const outputs: ToolOutput[] = [];

    for (let index = 0; index < pageCount; index++) {
      context.throwIfCancelled();
      context.report({
        stage: `Page ${index + 1} of ${pageCount}`,
        ratio: index / pageCount,
      });

      const single = await PDFDocument.create();
      const [page] = await single.copyPages(source, [index]);
      single.addPage(page);

      outputs.push({
        filename: `${base}-page-${index + 1}.pdf`,
        blob: toBlob(await single.save()),
      });
    }

    return { outputs };
  }

  // "extract" and "ranges" both resolve to a page list chosen by the user.
  const selected = options.pages.filter(
    (page) => page >= 1 && page <= pageCount,
  );
  if (selected.length === 0) throw new ToolError("EMPTY_SELECTION");

  context.report({ stage: "Extracting pages" });

  const output = await PDFDocument.create();
  const copied = await output.copyPages(
    source,
    selected.map((page) => page - 1),
  );
  for (const page of copied) output.addPage(page);

  return {
    outputs: [
      {
        filename: outputName(file.name, "pages", "pdf"),
        blob: toBlob(await output.save()),
      },
    ],
  };
}

/* ---------------- Extract / Delete ---------------- */

export async function extractPages(
  file: File,
  pages: number[],
  context: OperationContext,
): Promise<OperationResult> {
  return splitPdf(file, { mode: "extract", pages, ranges: "" }, context);
}

export async function deletePages(
  file: File,
  pages: number[],
  context: OperationContext,
): Promise<OperationResult> {
  const source = await loadPdf(file);
  const pageCount = source.getPageCount();
  const removing = new Set(pages);

  const keeping = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (page) => !removing.has(page),
  );

  if (keeping.length === 0) {
    throw new ToolError(
      "EMPTY_SELECTION",
      "That would remove every page. Keep at least one page.",
    );
  }
  if (keeping.length === pageCount) throw new ToolError("EMPTY_SELECTION");

  context.report({ stage: "Removing pages" });

  const output = await PDFDocument.create();
  const copied = await output.copyPages(
    source,
    keeping.map((page) => page - 1),
  );
  for (const page of copied) output.addPage(page);

  return {
    outputs: [
      {
        filename: outputName(file.name, "edited", "pdf"),
        blob: toBlob(await output.save()),
      },
    ],
  };
}

/* ---------------- Reorder ---------------- */

/**
 * Rebuilds the document with its pages in a new order.
 *
 * `order` is a list of 1-based source page numbers in their desired final
 * sequence, so it doubles as a permutation and as a filter — though the UI
 * only ever reorders, never drops. Validated strictly because a malformed
 * order would silently produce a document with missing or duplicated pages,
 * which the user might not notice until much later.
 */
export async function reorderPdf(
  file: File,
  order: number[],
  context: OperationContext,
): Promise<OperationResult> {
  const source = await loadPdf(file);
  const pageCount = source.getPageCount();

  if (order.length !== pageCount) {
    throw new ToolError("EMPTY_SELECTION", "Every page must appear exactly once.");
  }

  const seen = new Set<number>();
  for (const page of order) {
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new ToolError("EMPTY_SELECTION", "That page order is not valid.");
    }
    if (seen.has(page)) {
      throw new ToolError("EMPTY_SELECTION", "Every page must appear exactly once.");
    }
    seen.add(page);
  }

  // Reordering to the existing sequence would hand back an identical file
  // while implying work was done.
  const unchanged = order.every((page, index) => page === index + 1);
  if (unchanged) {
    throw new ToolError(
      "EMPTY_SELECTION",
      "The pages are already in this order. Drag a page to move it.",
    );
  }

  context.throwIfCancelled();
  context.report({ stage: "Rebuilding your document" });

  const output = await PDFDocument.create();
  const copied = await output.copyPages(
    source,
    order.map((page) => page - 1),
  );
  for (const page of copied) output.addPage(page);

  context.report({ stage: "Saving", ratio: 1 });

  return {
    outputs: [
      {
        filename: outputName(file.name, "reordered", "pdf"),
        blob: toBlob(await output.save()),
      },
    ],
  };
}

/* ---------------- Rotate ---------------- */

export async function rotatePdf(
  file: File,
  options: { angle: number; pages: number[] },
  context: OperationContext,
): Promise<OperationResult> {
  const document = await loadPdf(file);
  const pageCount = document.getPageCount();

  // An empty selection means "apply to the whole document".
  const targets =
    options.pages.length > 0
      ? options.pages
      : Array.from({ length: pageCount }, (_, index) => index + 1);

  context.report({ stage: "Rotating pages" });

  for (const pageNumber of targets) {
    context.throwIfCancelled();
    const page = document.getPage(pageNumber - 1);
    // Rotation is relative to the page's existing angle.
    page.setRotation(degrees((page.getRotation().angle + options.angle) % 360));
  }

  return {
    outputs: [
      {
        filename: outputName(file.name, "rotated", "pdf"),
        blob: toBlob(await document.save()),
      },
    ],
  };
}

/* ---------------- Compress ---------------- */

export type CompressionLevel = "recommended" | "smaller" | "smallest";

/**
 * Structural compression: object streams, deduplicated resources and stripped
 * metadata. Image re-encoding is handled separately by the image pipeline,
 * because it needs canvas access.
 */
export async function compressPdf(
  file: File,
  level: CompressionLevel,
  context: OperationContext,
): Promise<OperationResult> {
  const document = await loadPdf(file);

  context.report({ stage: "Analyzing document" });
  context.throwIfCancelled();

  // Metadata is pure overhead in an output file and often surprisingly large.
  document.setTitle("");
  document.setAuthor("");
  document.setSubject("");
  document.setKeywords([]);
  document.setProducer("");
  document.setCreator("");

  context.report({ stage: "Rebuilding document" });

  const bytes = await document.save({
    useObjectStreams: true,
    // A larger tick count means fewer, larger object streams: slightly slower
    // to write, smaller to store. Scale it with the requested level.
    objectsPerTick: level === "smallest" ? 200 : level === "smaller" ? 100 : 50,
  });

  return {
    outputs: [
      {
        filename: outputName(file.name, "compressed", "pdf"),
        blob: toBlob(bytes),
      },
    ],
  };
}

/* ---------------- Page count ---------------- */

/** Used by the page picker before any operation runs. */
export async function readPageCount(file: File): Promise<number> {
  const document = await loadPdf(file);
  return document.getPageCount();
}
