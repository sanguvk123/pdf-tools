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
