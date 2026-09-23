"use client";

import { useCallback } from "react";
import { ToolShell } from "@/components/ToolShell";
import { useToolRunner } from "@/lib/useToolRunner";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("merge-pdf");

export function MergeTool() {
  // Dynamic import: pdf-lib and the worker are fetched only on this route,
  // and only once a file has been selected.
  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("merge");
  }, []);

  const runner = useToolRunner({ tool: TOOL, loadEngine });

  return (
    <ToolShell
      tool={TOOL}
      runner={runner}
      // Merging needs at least two documents to mean anything.
      actionDisabled={runner.state.files.length < 2}
      options={
        runner.state.files.length === 1 ? (
          <p className="text-center text-[13px] text-muted">
            Add one more PDF to merge.
          </p>
        ) : null
      }
    />
  );
}