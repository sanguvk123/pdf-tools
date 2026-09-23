import type { ToolProgress, ToolResult } from "@/lib/types";
import type { ErrorCopy, ToolErrorCode } from "@/lib/errors";

/**
 * The universal tool state machine.
 *
 * Every tool page drives this same reducer, which is what makes the tools feel
 * identical: learn one, you know them all. Transitions are explicit, so an
 * inconsistent intermediate state is not representable.
 */
export type ToolStatus =
  | "IDLE"
  | "VALIDATING"
  | "READY"
  | "PASSWORD_REQUIRED"
  | "PROCESSING"
  | "SUCCESS"
  | "ERROR";

export interface ToolState {
  status: ToolStatus;
  files: File[];
  /** Tool-specific settings, e.g. { level: "recommended" }. */
  options: Record<string, unknown>;
  progress: ToolProgress | null;
  result: ToolResult | null;
  error: (ErrorCopy & { code: ToolErrorCode }) | null;
  password: string | null;
  /** Set once the user has downloaded, to switch the CTA to a quieter state. */
  downloaded: boolean;
}

export type ToolAction =
  | { type: "FILES_SELECTED"; files: File[] }
  | { type: "FILES_VALIDATED" }
  | { type: "FILES_CHANGED"; files: File[] }
  | { type: "OPTION_CHANGED"; key: string; value: unknown }
  | { type: "PASSWORD_REQUIRED" }
  | { type: "PASSWORD_SUBMITTED"; password: string }
  | { type: "PROCESSING_STARTED" }
  | { type: "PROGRESS"; progress: ToolProgress }
  | { type: "SUCCEEDED"; result: ToolResult }
  | { type: "FAILED"; error: ErrorCopy & { code: ToolErrorCode } }
  | { type: "DOWNLOADED" }
  | { type: "RESET" };

export function createInitialState(
  defaultOptions: Record<string, unknown> = {},
): ToolState {
  return {
    status: "IDLE",
    files: [],
    options: defaultOptions,
    progress: null,
    result: null,
    error: null,
    password: null,
    downloaded: false,
  };
}

export function toolReducer(state: ToolState, action: ToolAction): ToolState {
  switch (action.type) {
    case "FILES_SELECTED":
      // Selecting files always clears any previous run, so the user is never
      // looking at a stale result next to a new file.
      return {
        ...state,
        status: "VALIDATING",
        files: action.files,
        progress: null,
        result: null,
        error: null,
        password: null,
        downloaded: false,
      };

    case "FILES_VALIDATED":
      return state.status === "VALIDATING" ? { ...state, status: "READY" } : state;

    case "FILES_CHANGED": {
      // Reordering or removing files. Dropping to zero returns to IDLE.
      if (action.files.length === 0) {
        return { ...createInitialState(state.options) };
      }
      return { ...state, files: action.files, result: null, error: null };
    }

    case "OPTION_CHANGED":
      return {
        ...state,
        options: { ...state.options, [action.key]: action.value },
        // Changing an option after a run invalidates the result.
        result: state.status === "SUCCESS" ? null : state.result,
        status: state.status === "SUCCESS" ? "READY" : state.status,
        downloaded: false,
      };

    case "PASSWORD_REQUIRED":
      return { ...state, status: "PASSWORD_REQUIRED", progress: null };

    case "PASSWORD_SUBMITTED":
      return { ...state, status: "READY", password: action.password, error: null };

    case "PROCESSING_STARTED":
      return {
        ...state,
        status: "PROCESSING",
        progress: { stage: "Starting" },
        error: null,
        result: null,
      };

    case "PROGRESS":
      // Late progress from a cancelled or finished run must not revive the UI.
      return state.status === "PROCESSING"
        ? { ...state, progress: action.progress }
        : state;

    case "SUCCEEDED":
      return {
        ...state,
        status: "SUCCESS",
        result: action.result,
        progress: null,
        error: null,
      };

    case "FAILED":
      // A password error routes to the unlock prompt rather than a dead end.
      if (
        action.error.code === "PASSWORD_REQUIRED" ||
        action.error.code === "WRONG_PASSWORD"
      ) {
        return {
          ...state,
          status: "PASSWORD_REQUIRED",
          error: action.error,
          progress: null,
        };
      }
      // Cancelling is not a failure; return to the ready state silently.
      if (action.error.code === "CANCELLED") {
        return {
          ...state,
          status: state.files.length > 0 ? "READY" : "IDLE",
          progress: null,
          error: null,
        };
      }
      return { ...state, status: "ERROR", error: action.error, progress: null };

    case "DOWNLOADED":
      return { ...state, downloaded: true };

    case "RESET":
      return createInitialState(state.options);

    default:
      return state;
  }
}
