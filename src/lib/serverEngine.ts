"use client";

import { toolErrorFromCode, ToolError } from "@/lib/errors";
import { pluralize, stripExtension } from "@/lib/format";
import type { RunFn } from "@/lib/useToolRunner";

/**
 * Engine for the tools that run on the server.
 *
 * Satisfies exactly the same contract as the client worker engine, so the UI
 * cannot tell the difference — which is the point: the user should not have to
 * care where the work happens.
 */
export function createServerEngine(target: "docx" | "csv"): RunFn {
  return async ({ files }, onProgress, signal) => {
    const file = files[0];
    if (!file) throw new ToolError("NO_FILES");

    // Named stages rather than a fabricated percentage. Upload progress is
    // not observable with fetch, so we report the phase instead.
    onProgress({ stage: "Uploading your PDF" });

    let response: Response;
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target", target);

      response = await fetch("/api/convert", {
        method: "POST",
        body: form,
        signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ToolError("CANCELLED");
      }
      throw new ToolError("NETWORK_ERROR");
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { code?: string };
      throw toolErrorFromCode(body.code ?? "UNKNOWN");
    }

    onProgress({ stage: "Building your document" });

    const blob = await response.blob();
    const emptyPages = Number(response.headers.get("X-Empty-Pages") ?? 0);

    const extension = target === "docx" ? "docx" : "csv";
    const filename = `${stripExtension(file.name)}.${extension}`;

    return {
      outputs: [{ filename, blob }],
      inputBytes: file.size,
      outputBytes: blob.size,
      note:
        emptyPages > 0
          ? `${pluralize(emptyPages, "page")} had no selectable text, so ${
              emptyPages === 1 ? "it came" : "they came"
            } through empty.`
          : undefined,
    };
  };
}
