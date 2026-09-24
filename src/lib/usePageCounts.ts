"use client";

import { useEffect, useState } from "react";

/**
 * Only PDFs have a page count, and this list is also used by the
 * image-to-PDF tools. Without this guard every selected JPEG would be read
 * fully into memory and handed to pdf-lib purely to catch the throw — the
 * worst case being the tool where users drop twenty photos at once.
 */
export function looksLikePdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/** Stable identity, so an uncounted render does not change the returned map. */
const EMPTY: ReadonlyMap<File, number> = new Map();

/**
 * Page counts for a list of files, keyed by identity.
 *
 * A file card showing only "8.42 MB" makes the user verify the document
 * themselves — a size alone does not confirm they picked the right PDF, but
 * "42 pages" usually does. Merge is the clearest case: the page count is the
 * only way to tell two similarly-sized contracts apart before combining them.
 *
 * Counts arrive asynchronously and the UI renders without them, so a slow
 * read never delays the file appearing. pdf-lib is imported dynamically to
 * keep it off the initial route payload.
 */
export function usePageCounts(files: File[]): ReadonlyMap<File, number> {
  const [counted, setCounted] = useState<{ key: string; counts: Map<File, number> } | null>(null);

  // Identity, not contents: File objects are stable across renders, so this
  // only re-runs when the actual selection changes rather than on every
  // parent render.
  const key = files.map((file) => `${file.name}:${file.size}:${file.lastModified}`).join("|");

  useEffect(() => {
    if (files.length === 0) return;

    let cancelled = false;

    void (async () => {
      const next = new Map<File, number>();
      const pdfs = files.filter(looksLikePdf);

      // Every file resolves to a number, including the skipped ones, so
      // "counted" means "resolved" rather than "is a PDF" downstream.
      for (const file of files) next.set(file, 0);

      if (pdfs.length === 0) {
        if (!cancelled) setCounted({ key, counts: next });
        return;
      }

      const { PDFDocument } = await import("pdf-lib");

      for (const file of pdfs) {
        if (cancelled) return;

        try {
          const document = await PDFDocument.load(await file.arrayBuffer(), {
            ignoreEncryption: true,
          });
          next.set(file, document.getPageCount());
        } catch {
          // Unreadable or encrypted. The runner's validation reports that
          // properly; here the card simply omits the count rather than
          // showing a wrong or alarming number.
          next.set(file, 0);
        }
      }

      if (!cancelled) setCounted({ key, counts: next });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on identity above
  }, [key]);

  // Derived rather than synced, for the same reason as usePageCount: a
  // changed selection reads as uncounted immediately, with no extra render
  // pass and no frame in which the previous file's page count is still shown
  // beside the new file's name.
  return counted?.key === key ? counted.counts : EMPTY;
}
