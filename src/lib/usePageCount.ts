"use client";

import { useEffect, useState } from "react";

interface CountedFile {
  file: File;
  count: number;
}

/**
 * Reads a PDF's page count as soon as a file is selected.
 *
 * Runs concurrently with the user reading the options, so the page picker is
 * already populated by the time they look at it. pdf-lib is imported
 * dynamically to keep it off the initial route payload.
 */
export function usePageCount(file: File | undefined): number {
  const [counted, setCounted] = useState<CountedFile | null>(null);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    void (async () => {
      try {
        const { PDFDocument } = await import("pdf-lib");
        const document = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
        });
        if (!cancelled) setCounted({ file, count: document.getPageCount() });
      } catch {
        // An unreadable file is reported by the runner's validation path;
        // here we simply leave the picker empty.
        if (!cancelled) setCounted({ file, count: 0 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  // Derived rather than synced: a newly selected file reads as zero pages
  // until its own count arrives, with no extra render pass.
  return file && counted?.file === file ? counted.count : 0;
}
