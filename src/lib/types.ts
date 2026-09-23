/**
 * Shared contract between the UI, the client-side worker and the server
 * routes. The UI is written against this contract only, which is what lets
 * the same components drive a WASM/browser tool and a server tool without
 * the user ever noticing the difference.
 */

/** A single produced file, ready to download. */
export interface ToolOutput {
  filename: string;
  blob: Blob;
}

export interface ToolResult {
  outputs: ToolOutput[];
  /** Total input size in bytes, used for the "8.4 MB → 1.7 MB" line. */
  inputBytes: number;
  /** Total output size in bytes. */
  outputBytes: number;
  /** Optional plain-language note, e.g. "3 pages had no selectable text". */
  note?: string;
}

/**
 * Progress is reported as meaningful named stages, never as an invented
 * percentage. `ratio` is only supplied when the real completed fraction is
 * known (e.g. page 12 of 84).
 */
export interface ToolProgress {
  stage: string;
  ratio?: number;
}

export type ProgressHandler = (progress: ToolProgress) => void;

/** Everything an engine needs to do its job. */
export interface ToolRunRequest {
  files: File[];
  options: Record<string, unknown>;
  /** Supplied when a password-protected document has been unlocked. */
  password?: string;
}

/**
 * An engine executes one operation. Implementations live either in the
 * client worker or behind a server route; both satisfy this signature.
 */
export interface ToolEngineRunner {
  run(
    request: ToolRunRequest,
    onProgress: ProgressHandler,
    signal: AbortSignal,
  ): Promise<ToolResult>;
}

/** Operation identifiers understood by the client worker. */
export type ClientOperation =
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "delete-pages"
  | "extract-pages"
  | "protect"
  | "pdf-to-image"
  | "images-to-pdf";

/* ---------- Worker message protocol ---------- */

export interface WorkerRequestMessage {
  id: number;
  op: ClientOperation;
  files: File[];
  options: Record<string, unknown>;
  password?: string;
}

export type WorkerResponseMessage =
  | { id: number; type: "progress"; progress: ToolProgress }
  | {
      id: number;
      type: "done";
      outputs: ToolOutput[];
      inputBytes: number;
      outputBytes: number;
      note?: string;
    }
  | { id: number; type: "error"; code: string; message?: string };
