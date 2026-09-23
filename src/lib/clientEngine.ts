"use client";

import { toolErrorFromCode, ToolError } from "@/lib/errors";
import type {
  ClientOperation,
  ProgressHandler,
  ToolResult,
  WorkerResponseMessage,
} from "@/lib/types";
import type { RunFn } from "@/lib/useToolRunner";

/**
 * Bridge between the UI and the PDF Web Worker.
 *
 * One worker is shared across a page visit: spinning one up costs a module
 * fetch and a parse, so reusing it keeps the second operation instant.
 */

let worker: Worker | null = null;
let nextJobId = 1;

function getWorker(): Worker {
  worker ??= new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), {
    type: "module",
  });
  return worker;
}

/** Releases the worker, e.g. on route change. Safe to call repeatedly. */
export function disposeWorker(): void {
  worker?.terminate();
  worker = null;
}

/**
 * Runs one operation in the worker and resolves with its result. Cancellation
 * is forwarded so the worker can stop between pages instead of running to
 * completion and discarding the output.
 */
export function runInWorker(
  op: ClientOperation,
  files: File[],
  options: Record<string, unknown>,
  onProgress: ProgressHandler,
  signal: AbortSignal,
  password?: string,
): Promise<ToolResult> {
  return new Promise<ToolResult>((resolve, reject) => {
    const instance = getWorker();
    const id = nextJobId++;

    function cleanup() {
      instance.removeEventListener("message", onMessage);
      instance.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
    }

    function onMessage(event: MessageEvent) {
      const message = event.data as WorkerResponseMessage;
      if (message.id !== id) return;

      switch (message.type) {
        case "progress":
          onProgress(message.progress);
          break;

        case "done":
          cleanup();
          resolve({
            outputs: message.outputs,
            inputBytes: message.inputBytes,
            outputBytes: message.outputBytes,
            note: message.note,
          });
          break;

        case "error":
          cleanup();
          reject(toolErrorFromCode(message.code, message.message));
          break;
      }
    }

    function onError() {
      cleanup();
      // A worker-level error means the module failed to load or crashed;
      // neither is something we can explain to the user in detail.
      reject(new ToolError("UNKNOWN"));
    }

    function onAbort() {
      cleanup();
      instance.postMessage({ type: "cancel", id });
      reject(new ToolError("CANCELLED"));
    }

    instance.addEventListener("message", onMessage);
    instance.addEventListener("error", onError);
    signal.addEventListener("abort", onAbort, { once: true });

    instance.postMessage({ id, op, files, options, password });
  });
}

/**
 * Builds the engine function a tool page hands to useToolRunner.
 *
 * Tool pages call this inside a dynamic import, so the worker and pdf-lib are
 * only fetched on the route that actually needs them.
 */
export function createClientEngine(op: ClientOperation): RunFn {
  return (request, onProgress, signal) =>
    runInWorker(
      op,
      request.files,
      request.options,
      onProgress,
      signal,
      request.password,
    );
}
