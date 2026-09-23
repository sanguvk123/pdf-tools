/**
 * Long-tail landing pages for size-specific compression intent.
 *
 * These exist because "compress pdf to 200kb" is a genuinely different search
 * than "compress pdf": the user has a hard limit to meet. Each page pre-selects
 * a sensible strength and states honestly whether the target is achievable, so
 * it delivers real utility rather than being a thin duplicate.
 */

import type { CompressionLevel } from "@/workers/pdfOperations";

export interface CompressTarget {
  /** URL fragment: /compress-pdf-to-{slug} */
  slug: string;
  /** Display label, e.g. "1 MB". */
  label: string;
  /** Target size in bytes, used to judge whether the result met the goal. */
  bytes: number;
  /** Strength pre-selected for this target. */
  level: CompressionLevel;
}

export const COMPRESS_TARGETS: CompressTarget[] = [
  { slug: "1mb", label: "1 MB", bytes: 1_000_000, level: "recommended" },
  { slug: "500kb", label: "500 KB", bytes: 500_000, level: "smaller" },
  { slug: "200kb", label: "200 KB", bytes: 200_000, level: "smallest" },
  { slug: "100kb", label: "100 KB", bytes: 100_000, level: "smallest" },
];

export function getCompressTarget(slug: string): CompressTarget | undefined {
  return COMPRESS_TARGETS.find((target) => target.slug === slug);
}
