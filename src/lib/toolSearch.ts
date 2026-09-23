import { TOOLS, type Tool } from "@/lib/tools";

/**
 * Finds a tool from the words a person would actually use.
 *
 * The naive version of this feature matches the query against tool names, and
 * it demos perfectly: type "merge", get Merge PDF. It then fails for nearly
 * every real query, because nobody searching for a PDF compressor types
 * "compress-pdf" — they type "make pdf smaller", "reduce file size", or
 * "shrink". A search that answers those is worth having; one that only matches
 * names is a slower version of the tool grid that is already on the page.
 *
 * So each tool carries an explicit keyword list. That is unglamorous compared
 * with fuzzy-matching the whole catalogue, but it is predictable, instant, and
 * debuggable: when a query misses, the fix is to add the phrase someone used,
 * not to tune a scoring threshold and hope.
 */

const MAX_RESULTS = 6;

/**
 * Phrases that should lead to each tool, beyond its own name.
 *
 * Written as the user's words, not ours: "picture" and "photo" rather than
 * "raster image", "make smaller" rather than "optimise".
 */
const KEYWORDS: Record<string, string[]> = {
  "merge-pdf": [
    "combine",
    "join",
    "together",
    "append",
    "concatenate",
    "one file",
    "single file",
    "multiple",
  ],
  "split-pdf": [
    "separate",
    "divide",
    "break apart",
    "cut",
    "single pages",
    "into pages",
    "one per page",
  ],
  "compress-pdf": [
    "smaller",
    "shrink",
    "reduce",
    "size",
    "compression",
    "too big",
    "large",
    "optimise",
    "optimize",
    "email limit",
  ],
  "rotate-pdf": [
    "turn",
    "sideways",
    "upside down",
    "landscape",
    "portrait",
    "orientation",
    "straighten",
  ],
  "delete-pages-pdf": [
    "remove",
    "delete",
    "erase",
    "get rid of",
    "take out",
    "drop pages",
    "blank pages",
  ],
  "extract-pages-pdf": [
    "extract",
    "pull out",
    "save pages",
    "keep only",
    "specific pages",
    "selected pages",
    "copy pages",
  ],
  "reorder-pdf-pages": [
    "rearrange",
    "reorder",
    "move pages",
    "change order",
    "sort pages",
    "shuffle",
    "swap",
  ],
  "pdf-to-word": [
    "word",
    "docx",
    "doc",
    "editable",
    "edit",
    "microsoft word",
    "document",
  ],
  "pdf-to-text": [
    "text",
    "txt",
    "plain text",
    "copy text",
    "extract text",
    "get the words",
    "transcript",
  ],
  "pdf-to-excel": [
    "excel",
    "xlsx",
    "spreadsheet",
    "table",
    "tables",
    "csv",
    "rows",
    "columns",
  ],
  "pdf-to-jpg": [
    "jpg",
    "jpeg",
    "picture",
    "pictures",
    "photo",
    "image",
    "images",
    "screenshot",
  ],
  "pdf-to-png": ["png", "transparent", "picture", "image", "lossless"],
  "jpg-to-pdf": [
    "jpg",
    "jpeg",
    "photo",
    "photos",
    "picture",
    "camera",
    "scan",
    "from image",
  ],
  "png-to-pdf": ["png", "screenshot", "screenshots", "from image"],
  "image-to-pdf": [
    "image",
    "images",
    "webp",
    "gif",
    "any image",
    "mixed",
    "from image",
  ],
};

/**
 * Catch-all tools that accept several input formats.
 *
 * "photo to pdf" is genuinely served by both JPG → PDF and Image → PDF, so
 * neither is wrong — but the user named a specific kind of file, and the
 * specific tool is the better answer. This breaks the tie toward the
 * specialist while leaving the generalist in the list as a valid alternative.
 */
const GENERALIST_TOOLS = new Set(["image-to-pdf"]);

/**
 * Words that carry no signal on a site where every tool involves a PDF and
 * most involve pages. Left in the raw query for phrase matching, but excluded
 * from per-word scoring so they cannot be the reason a tool matches.
 *
 * Without this, "remove pages" ranks every page tool equally on "pages" and
 * the intended verb is drowned out, and "book a flight to paris" matches all
 * the `x-to-y` converters on the word "to".
 */
const STOP_WORDS = new Set([
  "pdf",
  "pdfs",
  "file",
  "files",
  "page",
  "pages",
  "document",
  "documents",
  "to",
  "a",
  "an",
  "the",
  "my",
  "of",
  "out",
  "into",
  "from",
  "online",
  "free",
]);

/**
 * Normalises a query for comparison: lowercase, punctuation stripped, runs of
 * whitespace collapsed. Keeps spaces because several keywords are phrases.
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Which side of the arrow the user means.
 *
 * "pdf to picture" and "photo to pdf" share every meaningful word, so word
 * matching alone cannot tell them apart — it picks whichever tool happens to
 * list more synonyms. Reading the direction is the only way to get both right.
 */
function conversionDirection(query: string): "from-pdf" | "to-pdf" | null {
  const match = /\b(.+?)\s+to\s+(.+)\b/.exec(query);
  if (!match) return null;

  const [, source, destination] = match;
  const sourceIsPdf = /\bpdfs?\b/.test(source);
  const destinationIsPdf = /\bpdfs?\b/.test(destination);

  if (sourceIsPdf && !destinationIsPdf) return "from-pdf";
  if (destinationIsPdf && !sourceIsPdf) return "to-pdf";
  return null;
}

/**
 * True when two words differ by at most one insertion, deletion, substitution
 * or transposition — Damerau-Levenshtein distance 1.
 *
 * Transposition has to be included: "mrege" for "merge" and "teh" for "the"
 * are the most common typing errors there are, and a plain left-to-right scan
 * counts them as two edits and rejects them.
 *
 * Distance stays capped at 1 deliberately. Allowing 2 makes "remove" match
 * "reorder", which is not a typo but a different tool — and sending someone
 * who typed "remove pages" to the page reorderer is worse than showing them
 * nothing, because the wrong answer looks like a right one.
 */
function isNearMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  // Too short to distinguish a typo from a genuinely different word.
  if (a.length < 4 || b.length < 4) return false;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const distance: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0),
  );

  for (let i = 0; i < rows; i++) distance[i][0] = i;
  for (let j = 0; j < cols; j++) distance[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + cost,
      );

      // Adjacent transposition, e.g. "mrege" -> "merge".
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distance[i][j] = Math.min(distance[i][j], distance[i - 2][j - 2] + 1);
      }
    }
  }

  return distance[a.length][b.length] <= 1;
}

/**
 * Higher is better. Scores are ordinal, not meaningful in themselves; they
 * exist so an exact name beats a keyword, and a keyword beats a typo.
 */
function scoreTool(
  tool: Tool,
  query: string,
  queryWords: string[],
  direction: "from-pdf" | "to-pdf" | null,
): number {
  const name = normalise(tool.name);
  const slug = normalise(tool.slug.replace(/-/g, " "));

  if (name === query || slug === query) return 100;
  if (name.startsWith(query) || slug.startsWith(query)) return 90;
  if (name.includes(query) || slug.includes(query)) return 80;

  const keywords = KEYWORDS[tool.slug] ?? [];

  // Whole-phrase keyword hit, e.g. "one file" or "too big".
  //
  // Matched on word boundaries rather than with includes(). A plain substring
  // test makes "remove pages" contain the phrase "move pages", which ranked
  // the page reorderer above the page deleter for a query that means the
  // opposite — the sort of match that looks like a ranking bug but is really
  // the comparison being wrong.
  for (const keyword of keywords) {
    if (!keyword.includes(" ")) continue;

    const phrase = new RegExp(
      `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    );
    if (phrase.test(query)) return 70;
  }

  let score = 0;

  // Stop words are stripped from the tool's own indexed words too, not just
  // from the query. Otherwise "pages" — which appears in both the name and
  // the slug of Reorder pages, but only the name of Delete pages — acts as a
  // tiebreaker between two tools it says nothing about, and "remove pages"
  // lands on the reorderer.
  const nameWords = new Set(
    [...name.split(" "), ...slug.split(" ")].filter(
      (word) => word && !STOP_WORDS.has(word),
    ),
  );

  for (const word of queryWords) {
    if (nameWords.has(word)) {
      score += 30;
      continue;
    }

    if (keywords.includes(word)) {
      score += 25;
      continue;
    }

    // Typo tolerance, scored below an exact hit so a clean match always wins.
    if ([...nameWords].some((candidate) => isNearMatch(word, candidate))) {
      score += 14;
      continue;
    }

    if (keywords.some((keyword) => isNearMatch(word, keyword))) {
      score += 12;
    }
  }

  // Nothing matched on content; direction alone must not conjure a result.
  if (score === 0) return 0;

  if (direction) {
    const convertsFromPdf = tool.slug.startsWith("pdf-to-");
    const convertsToPdf = tool.slug.endsWith("-to-pdf");

    if (direction === "from-pdf" && convertsFromPdf) score += 40;
    if (direction === "to-pdf" && convertsToPdf) score += 40;

    // Penalise the mirror-image tool. "photo to pdf" and "pdf to photo" share
    // every keyword, so without this the wrong one frequently wins on
    // synonym count alone.
    if (direction === "from-pdf" && convertsToPdf) score -= 20;
    if (direction === "to-pdf" && convertsFromPdf) score -= 20;
  }

  return score;
}

/**
 * Returns the best-matching tools, most relevant first, or an empty array when
 * nothing plausibly matches.
 *
 * Returning nothing is a deliberate outcome. A ranking that always produces a
 * result would answer "book a flight to paris" with a PDF compressor, which
 * erodes trust in every other result it gives.
 */
export function searchTools(rawQuery: string): Tool[] {
  const query = normalise(rawQuery);
  if (!query) return [];

  const allWords = query.split(" ");
  const meaningful = allWords.filter((word) => !STOP_WORDS.has(word));

  // A query of nothing but stop words ("pdf", "my file") has no intent to act
  // on, so fall back to the raw words and let the name matching above decide.
  const words = meaningful.length ? meaningful : allWords;

  const direction = conversionDirection(query);

  return TOOLS.map((tool) => ({
    tool,
    score: scoreTool(tool, query, words, direction),
  }))
    .filter((entry) => entry.score >= 12)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      // A specific tool beats the catch-all on an equal score: someone who
      // said "photo" wants JPG → PDF, not the generic image converter.
      const aGeneral = GENERALIST_TOOLS.has(a.tool.slug);
      const bGeneral = GENERALIST_TOOLS.has(b.tool.slug);
      if (aGeneral !== bGeneral) return aGeneral ? 1 : -1;

      // Then the tools people want most often.
      if (a.tool.featured !== b.tool.featured) return a.tool.featured ? -1 : 1;
      return a.tool.name.localeCompare(b.tool.name);
    })
    .slice(0, MAX_RESULTS)
    .map((entry) => entry.tool);
}
