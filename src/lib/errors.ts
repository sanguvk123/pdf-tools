/**
 * Error taxonomy.
 *
 * Engines throw ToolError with a code. The UI only ever renders the mapped
 * human copy, so a raw message like "Ghostscript exited with status 1" can
 * never reach a user.
 */

export type ToolErrorCode =
  | "UNSUPPORTED_FILE"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_FILES"
  | "NO_FILES"
  | "PASSWORD_REQUIRED"
  | "WRONG_PASSWORD"
  | "CORRUPT_FILE"
  | "EMPTY_SELECTION"
  | "NO_TEXT_CONTENT"
  | "NETWORK_ERROR"
  | "CANCELLED"
  | "UNKNOWN";

export class ToolError extends Error {
  readonly code: ToolErrorCode;
  /** Extra context for the message, e.g. the size limit that was exceeded. */
  readonly detail?: string;

  constructor(code: ToolErrorCode, detail?: string, options?: { cause?: unknown }) {
    super(code, options);
    this.name = "ToolError";
    this.code = code;
    this.detail = detail;
  }
}

export interface ErrorCopy {
  /** Short headline. */
  title: string;
  /** One sentence explaining the likely cause and what to do. */
  body: string;
}

const COPY: Record<ToolErrorCode, ErrorCopy> = {
  UNSUPPORTED_FILE: {
    title: "This file isn't supported",
    body: "Check the file type and try again with a file this tool can read.",
  },
  FILE_TOO_LARGE: {
    title: "This file is too large",
    body: "Try a smaller file, or split it into parts first.",
  },
  TOO_MANY_FILES: {
    title: "That's a few too many files",
    body: "Remove some files and run the tool again.",
  },
  NO_FILES: {
    title: "No file selected",
    body: "Choose a file to get started.",
  },
  PASSWORD_REQUIRED: {
    title: "This PDF is password protected",
    body: "Enter the password to continue.",
  },
  WRONG_PASSWORD: {
    title: "That password didn't work",
    body: "Check for typos and try again.",
  },
  CORRUPT_FILE: {
    title: "We couldn't read this PDF",
    body: "The file may be damaged. Try opening and re-saving it, then upload it again.",
  },
  EMPTY_SELECTION: {
    title: "Nothing selected",
    body: "Select at least one page to continue.",
  },
  NO_TEXT_CONTENT: {
    title: "We couldn't find any text",
    body: "This PDF looks like a scan, so there is no selectable text to convert.",
  },
  NETWORK_ERROR: {
    title: "Connection lost",
    body: "Check your internet connection and try again.",
  },
  CANCELLED: {
    title: "Cancelled",
    body: "Nothing was changed. You can start again whenever you like.",
  },
  UNKNOWN: {
    title: "We couldn't process this file",
    body: "The file may be damaged or password-protected. Try another file.",
  },
};

/** Never throws, and never leaks a technical message. */
export function describeError(error: unknown): ErrorCopy & { code: ToolErrorCode } {
  if (error instanceof ToolError) {
    const copy = COPY[error.code];
    return {
      code: error.code,
      title: copy.title,
      body: error.detail ?? copy.body,
    };
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return { code: "CANCELLED", ...COPY.CANCELLED };
  }

  return { code: "UNKNOWN", ...COPY.UNKNOWN };
}

/** Rebuilds a ToolError after it crosses the worker boundary. */
export function toolErrorFromCode(code: string, detail?: string): ToolError {
  const known = code in COPY ? (code as ToolErrorCode) : "UNKNOWN";
  return new ToolError(known, detail);
}

export interface RecoveryAction {
  /** Button text. Names the destination, so the user knows before clicking. */
  label: string;
  /** Path to a tool that can plausibly succeed where this one failed. */
  href: string;
  /** One line on why this is being offered. */
  reason: string;
}

/**
 * Where to send someone whose file this tool cannot handle.
 *
 * The error copy already explains what went wrong, which leaves the user
 * informed and stuck — they close the tab. A scanned PDF on /pdf-to-word is
 * the clearest case: nothing about that document will ever convert to text,
 * but the same pages rasterise to images perfectly.
 *
 * Returns null when no other tool would genuinely do better. That is the
 * important half. A suggestion that cannot work costs the user another upload
 * to discover, and teaches them to ignore the ones that would have helped.
 */
export function recoveryAction(
  code: ToolErrorCode,
  tool: { slug: string },
): RecoveryAction | null {
  const notCurrentTool = (candidate: RecoveryAction): RecoveryAction | null =>
    // Suggesting the page the user is already stuck on reads as a broken site.
    candidate.href === `/${tool.slug}` ? null : candidate;

  switch (code) {
    case "NO_TEXT_CONTENT":
      // No text layer exists. Every text-extraction tool fails identically,
      // so the only honest suggestion is one that treats pages as pictures.
      return notCurrentTool({
        label: "Convert pages to images instead",
        href: "/pdf-to-jpg",
        reason: "Scanned pages are pictures, so they can still be saved as images.",
      });

    case "FILE_TOO_LARGE":
      // Two ways out: make it smaller, or work on part of it. Offer whichever
      // the user is not already on.
      return (
        notCurrentTool({
          label: "Split it into smaller files",
          href: "/split-pdf",
          reason: "Working on part of the document keeps each file under the limit.",
        }) ??
        notCurrentTool({
          label: "Compress it first",
          href: "/compress-pdf",
          reason: "A smaller file will fit within the limit.",
        })
      );

    case "TOO_MANY_FILES":
      return notCurrentTool({
        label: "Merge them into one PDF first",
        href: "/merge-pdf",
        reason: "One combined file avoids the per-run limit.",
      });

    case "UNSUPPORTED_FILE":
      return notCurrentTool({
        label: "Turn an image into a PDF",
        href: "/image-to-pdf",
        reason: "If you have a photo or screenshot, this converts it to a PDF first.",
      });

    case "CORRUPT_FILE":
    case "UNKNOWN":
      // Neither code identifies a cause, so anything specific would be a
      // guess. Compression rewrites the file structure, which does repair
      // some malformed documents — offered as a maybe, worded as one.
      return notCurrentTool({
        label: "Try rewriting it with Compress",
        href: "/compress-pdf",
        reason: "Rebuilding the file sometimes fixes a document that will not open.",
      });

    // Deliberately no action. These are resolved on this page, by this user,
    // and a link away from it would be a distraction rather than help.
    case "PASSWORD_REQUIRED":
    case "WRONG_PASSWORD":
    case "EMPTY_SELECTION":
    case "NO_FILES":
    case "NETWORK_ERROR":
    case "CANCELLED":
      return null;
  }
}
