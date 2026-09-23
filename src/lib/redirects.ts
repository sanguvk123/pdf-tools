/**
 * Synonym URLs that permanently redirect to their canonical tool page.
 *
 * People search for the same operation using different words: "combine PDF"
 * and "merge PDF" are one intent, not two. Publishing a separate page for each
 * phrasing would mean several near-identical pages competing for the same
 * query — the pattern Google classifies as doorway pages, which risks the
 * ranking of the real page too.
 *
 * A 301 captures the traffic and passes link equity to the canonical page
 * without duplicating content. The rule applied here: if the phrasing would
 * not change anything the user sees, it is a redirect, not a page. When the
 * intent genuinely changes a default (a target size, a quality preference),
 * it earns a real page instead — see `compressTargets` and `intents`.
 */

export interface SynonymRedirect {
  /** Incoming path, without a leading slash. */
  from: string;
  /** Canonical path to send the visitor to. */
  to: string;
}

export const SYNONYM_REDIRECTS: SynonymRedirect[] = [
  // "Combine" is the most common synonym for merging.
  { from: "combine-pdf", to: "merge-pdf" },
  { from: "merge-multiple-pdf", to: "merge-pdf" },
  { from: "merge-multiple-pdf-files", to: "merge-pdf" },
  { from: "merge-pdf-online", to: "merge-pdf" },
  { from: "merge-2-pdf-files", to: "merge-pdf" },

  // Splitting by page is what the splitter already does by default.
  { from: "split-pdf-by-pages", to: "split-pdf" },

  // These read as different tools but are the existing page-level tools.
  { from: "extract-pages-from-pdf", to: "extract-pages-pdf" },
  { from: "delete-pages-from-pdf", to: "delete-pages-pdf" },
  { from: "remove-pages-from-pdf", to: "delete-pages-pdf" },

  // Image inputs land on the one tool that accepts every image type.
  { from: "images-to-pdf", to: "image-to-pdf" },

  // Conversion phrasings.
  { from: "pdf-to-docx", to: "pdf-to-word" },
  { from: "pdf-to-xlsx", to: "pdf-to-excel" },
  { from: "pdf-to-jpeg", to: "pdf-to-jpg" },
];
