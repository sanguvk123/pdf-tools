/**
 * Compression landing pages driven by intent rather than a byte target.
 *
 * "Compress PDF without losing quality" and "compress a large PDF" are not
 * phrasings of the same search — they want opposite things. The first is
 * protective and should barely touch the file; the second is desperate and
 * wants maximum reduction. Each therefore pre-selects a different strength,
 * which is what makes them real pages rather than duplicates of
 * /compress-pdf with a new title.
 *
 * Anything that would not change a default belongs in `redirects` instead.
 */

import type { CompressionLevel } from "@/workers/pdfOperations";

export interface CompressIntent {
  /** Full URL segment, so each page reads naturally as a search phrase. */
  slug: string;
  /** H1, matching the Google title. */
  heading: string;
  /** Sentence under the H1. */
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  /** Strength this intent pre-selects — the reason the page exists. */
  level: CompressionLevel;
  /** Why this strength suits the intent, shown as body copy. */
  rationale: string;
  faq: { q: string; a: string }[];
}

export const COMPRESS_INTENTS: CompressIntent[] = [
  {
    slug: "compress-pdf-without-losing-quality",
    heading: "Compress PDF Without Losing Quality",
    subtitle: "Make your PDF smaller while keeping it sharp.",
    metaTitle: "Compress PDF Without Losing Quality — free online",
    metaDescription:
      "Reduce PDF file size while keeping text sharp and images readable. Pre-set to the gentlest compression. Free, no signup, runs on your device.",
    level: "recommended",
    rationale:
      "This page uses the gentlest setting, which removes structural waste — duplicated resources, unused objects and bloated metadata — before it touches anything you can see. Text is never re-encoded, so it stays perfectly sharp and fully selectable at any zoom.",
    faq: [
      {
        q: "Is this genuinely lossless?",
        a: "For text, yes: text is never rasterised or re-encoded, so it stays exactly as sharp as the original. Embedded photographs may be re-encoded to save space, which is technically lossy, though the change is not usually visible at normal viewing sizes.",
      },
      {
        q: "How much smaller will my file get?",
        a: "It depends entirely on what is inside. Text-heavy documents exported from Word often shrink a lot because they carry redundant structure. A file that is already well optimised may barely change — and we will show you the exact before and after, including when the saving is small.",
      },
      {
        q: "What if I need it much smaller than this?",
        a: "Use the main Compress PDF tool and choose a stronger setting, or pick a size-specific page such as compress to 1 MB. Those trade visible quality for size, which is the opposite of what this page is for.",
      },
    ],
  },
  {
    slug: "compress-large-pdf",
    heading: "Compress Large PDF",
    subtitle: "Shrink a big document down to a sendable size.",
    metaTitle: "Compress Large PDF Online — free, no signup",
    metaDescription:
      "Reduce the size of large PDF files so they fit email and upload limits. Handles files up to 100 MB, free and processed on your device.",
    level: "smaller",
    rationale:
      "Large files are usually large because of scanned pages or high-resolution photographs, so this page starts from a stronger setting than the default. Because compression runs in your browser there is no upload step, which matters most exactly when the file is big.",
    faq: [
      {
        q: "How large a file can I compress?",
        a: "Up to 100 MB. The work happens on your own device, so the practical limit is your available memory rather than a server quota or an upload timeout.",
      },
      {
        q: "Why is my PDF so large in the first place?",
        a: "Almost always scanned pages or embedded photographs. A scan stores a full image for every page, which is why a 20-page scanned document can dwarf a 200-page text document.",
      },
      {
        q: "What if it is still too big afterwards?",
        a: "When a document is mostly scans there is a floor to how far compression can go. At that point the effective move is to send fewer pages — extract just the ones you need, or split the document and send it in parts.",
      },
    ],
  },
  {
    slug: "reduce-pdf-size",
    heading: "Reduce PDF File Size",
    subtitle: "Make your PDF smaller in one step.",
    metaTitle: "Reduce PDF File Size Online — free PDF compressor",
    metaDescription:
      "Reduce PDF file size online without installing software. Pick how hard to compress, see the exact saving, and download. Free and private.",
    level: "recommended",
    rationale:
      "A balanced starting point: enough reduction to make a real difference to attachment limits, without the visible softening that maximum compression causes. You can change the strength before compressing if you need to go further.",
    faq: [
      {
        q: "Will the text still be selectable?",
        a: "Yes. Text remains real text — selectable, searchable and copyable. Compression works on document structure and image data, never by flattening pages into pictures.",
      },
      {
        q: "Do I need to install anything?",
        a: "No. It runs in your browser, with no account, no extension and no desktop application.",
      },
      {
        q: "Are my documents uploaded anywhere?",
        a: "No. The file is processed on your own device and never sent to a server.",
      },
    ],
  },
];

export function getCompressIntent(slug: string): CompressIntent | undefined {
  return COMPRESS_INTENTS.find((intent) => intent.slug === slug);
}
