/** Presentation and parsing helpers. Pure functions, no DOM access. */

/** "8.4 MB", "912 KB", "640 bytes". */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1000) return `${Math.round(bytes)} bytes`;

  const kb = bytes / 1000;
  if (kb < 1000) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;

  const mb = kb / 1000;
  if (mb < 1000) return `${mb < 10 ? mb.toFixed(1) : mb.toFixed(0)} MB`;

  return `${(mb / 1000).toFixed(1)} GB`;
}

/**
 * Size reduction as a whole percentage. Returns 0 when the output grew,
 * so the success screen never claims a negative saving.
 */
export function reductionPercent(inputBytes: number, outputBytes: number): number {
  if (inputBytes <= 0 || outputBytes >= inputBytes) return 0;
  return Math.round(((inputBytes - outputBytes) / inputBytes) * 100);
}

/** "Resume.pdf" -> "Resume". Leaves extension-less names untouched. */
export function stripExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
}

/** Builds an output name from an input name: ("Resume.pdf", "min") -> "Resume-min.pdf". */
export function outputName(
  inputFilename: string,
  suffix: string,
  extension: string,
): string {
  return `${stripExtension(inputFilename)}-${suffix}.${extension}`;
}

/**
 * Parses page-range syntax such as "1-3, 8, 11-14" into sorted, unique,
 * 1-based page numbers. Out-of-range and malformed parts are ignored rather
 * than throwing, so the field can be validated live as the user types.
 */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const pages = new Set<number>();

  for (const rawPart of input.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;

    const range = /^(\d+)\s*[-–]\s*(\d+)$/.exec(part);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      const [low, high] = start <= end ? [start, end] : [end, start];
      for (let page = Math.max(1, low); page <= Math.min(pageCount, high); page++) {
        pages.add(page);
      }
      continue;
    }

    if (/^\d+$/.test(part)) {
      const page = Number(part);
      if (page >= 1 && page <= pageCount) pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

/** Collapses [1,2,3,5,9,10] into "1-3, 5, 9-10" for display. */
export function formatPageRanges(pages: number[]): string {
  if (pages.length === 0) return "";

  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index <= sorted.length; index++) {
    const page = sorted[index];
    if (page !== previous + 1) {
      parts.push(start === previous ? `${start}` : `${start}-${previous}`);
      start = page;
    }
    previous = page;
  }

  return parts.join(", ");
}

/** "3 pages" / "1 page". */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}
