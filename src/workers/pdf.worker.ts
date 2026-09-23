/// <reference lib="webworker" />

import { ToolError } from "@/lib/errors";
import {
  compressPdf,
  deletePages,
  extractPages,
  mergePdfs,
  rotatePdf,
  splitPdf,
  type CompressionLevel,
  type OperationContext,
  type OperationResult,
  type SplitMode,
} from "@/workers/pdfOperations";
import type {
  ClientOperation,
  WorkerRequestMessage,
  WorkerResponseMessage,
} from "@/lib/types";

/**
 * Web Worker entry point.
 *
 * All heavy PDF work happens here so the main thread never blocks: the user
 * can keep scrolling, cancelling and adding files while a job runs.
 */

declare const self: DedicatedWorkerGlobalScope;

/** Jobs the main thread has asked us to abort. */
const cancelled = new Set<number>();

function post(message: WorkerResponseMessage) {
  self.postMessage(message);
}

function totalBytes(files: File[]): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

async function execute(
  op: ClientOperation,
  files: File[],
  options: Record<string, unknown>,
  context: OperationContext,
): Promise<OperationResult> {
  switch (op) {
    case "merge":
      return mergePdfs(files, context);

    case "split":
      return splitPdf(
        files[0],
        {
          mode: (options.mode as SplitMode) ?? "extract",
          pages: (options.pages as number[]) ?? [],
          ranges: (options.ranges as string) ?? "",
        },
        context,
      );

    case "extract-pages":
      return extractPages(files[0], (options.pages as number[]) ?? [], context);

    case "delete-pages":
      return deletePages(files[0], (options.pages as number[]) ?? [], context);

    case "rotate":
      return rotatePdf(
        files[0],
        {
          angle: (options.angle as number) ?? 90,
          pages: (options.pages as number[]) ?? [],
        },
        context,
      );

    case "compress":
      return compressPdf(
        files[0],
        (options.level as CompressionLevel) ?? "recommended",
        context,
      );

    default:
      throw new ToolError("UNKNOWN");
  }
}

self.addEventListener("message", (event: MessageEvent) => {
  const data = event.data as WorkerRequestMessage | { type: "cancel"; id: number };

  if ("type" in data && data.type === "cancel") {
    cancelled.add(data.id);
    return;
  }

  const request = data as WorkerRequestMessage;
  const { id, op, files, options, password } = request;

  const context: OperationContext = {
    report: (progress) => {
      if (!cancelled.has(id)) post({ id, type: "progress", progress });
    },
    throwIfCancelled: () => {
      if (cancelled.has(id)) throw new ToolError("CANCELLED");
    },
    password,
  };

  void (async () => {
    try {
      const result = await execute(op, files, options, context);

      if (cancelled.has(id)) {
        cancelled.delete(id);
        return;
      }

      const outputBytes = result.outputs.reduce(
        (sum, output) => sum + output.blob.size,
        0,
      );

      post({
        id,
        type: "done",
        outputs: result.outputs,
        inputBytes: totalBytes(files),
        outputBytes,
        note: result.note,
      });
    } catch (error) {
      if (cancelled.has(id)) {
        cancelled.delete(id);
        return;
      }

      const code = error instanceof ToolError ? error.code : "UNKNOWN";
      const message = error instanceof ToolError ? error.detail : undefined;

      post({ id, type: "error", code, message });
    } finally {
      cancelled.delete(id);
    }
  })();
});
