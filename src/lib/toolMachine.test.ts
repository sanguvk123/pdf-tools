import { describe, expect, it } from "vitest";
import { createInitialState, toolReducer, type ToolState } from "@/lib/toolMachine";
import type { ToolResult } from "@/lib/types";

function fileNamed(name: string): File {
  return new File(["x"], name, { type: "application/pdf" });
}

const result: ToolResult = {
  outputs: [{ filename: "out.pdf", blob: new Blob(["x"]) }],
  inputBytes: 1000,
  outputBytes: 400,
};

function stateWith(overrides: Partial<ToolState>): ToolState {
  return { ...createInitialState(), ...overrides };
}

describe("toolReducer", () => {
  it("starts idle with the supplied default options", () => {
    const state = createInitialState({ level: "recommended" });

    expect(state.status).toBe("IDLE");
    expect(state.options).toEqual({ level: "recommended" });
    expect(state.files).toEqual([]);
  });

  it("moves through validating to ready when files are selected", () => {
    const selected = toolReducer(createInitialState(), {
      type: "FILES_SELECTED",
      files: [fileNamed("a.pdf")],
    });
    expect(selected.status).toBe("VALIDATING");

    const ready = toolReducer(selected, { type: "FILES_VALIDATED" });
    expect(ready.status).toBe("READY");
  });

  it("clears a previous result when new files are selected", () => {
    const succeeded = stateWith({ status: "SUCCESS", result, downloaded: true });

    const next = toolReducer(succeeded, {
      type: "FILES_SELECTED",
      files: [fileNamed("b.pdf")],
    });

    expect(next.result).toBeNull();
    expect(next.downloaded).toBe(false);
  });

  it("returns to idle when the last file is removed", () => {
    const ready = stateWith({ status: "READY", files: [fileNamed("a.pdf")] });

    const next = toolReducer(ready, { type: "FILES_CHANGED", files: [] });

    expect(next.status).toBe("IDLE");
    expect(next.files).toEqual([]);
  });

  it("invalidates a finished result when an option changes", () => {
    const succeeded = stateWith({ status: "SUCCESS", result });

    const next = toolReducer(succeeded, {
      type: "OPTION_CHANGED",
      key: "level",
      value: "smallest",
    });

    expect(next.status).toBe("READY");
    expect(next.result).toBeNull();
    expect(next.options.level).toBe("smallest");
  });

  it("ignores progress that arrives when not processing", () => {
    const ready = stateWith({ status: "READY" });

    const next = toolReducer(ready, {
      type: "PROGRESS",
      progress: { stage: "Merging" },
    });

    expect(next.progress).toBeNull();
    expect(next).toBe(ready);
  });

  it("routes a password failure to the unlock prompt, not the error screen", () => {
    const processing = stateWith({ status: "PROCESSING" });

    const next = toolReducer(processing, {
      type: "FAILED",
      error: { code: "PASSWORD_REQUIRED", title: "Locked", body: "Enter password" },
    });

    expect(next.status).toBe("PASSWORD_REQUIRED");
  });

  it("treats cancellation as a return to ready rather than an error", () => {
    const processing = stateWith({
      status: "PROCESSING",
      files: [fileNamed("a.pdf")],
    });

    const next = toolReducer(processing, {
      type: "FAILED",
      error: { code: "CANCELLED", title: "Cancelled", body: "" },
    });

    expect(next.status).toBe("READY");
    expect(next.error).toBeNull();
  });

  it("surfaces a genuine failure on the error screen", () => {
    const processing = stateWith({ status: "PROCESSING" });

    const next = toolReducer(processing, {
      type: "FAILED",
      error: { code: "CORRUPT_FILE", title: "Damaged", body: "Try another file" },
    });

    expect(next.status).toBe("ERROR");
    expect(next.error?.code).toBe("CORRUPT_FILE");
  });

  it("keeps the chosen options after a reset", () => {
    const dirty = stateWith({
      status: "SUCCESS",
      result,
      options: { level: "smallest" },
    });

    const next = toolReducer(dirty, { type: "RESET" });

    expect(next.status).toBe("IDLE");
    expect(next.options).toEqual({ level: "smallest" });
    expect(next.result).toBeNull();
  });
});
