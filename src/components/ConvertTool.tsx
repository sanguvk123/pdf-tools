"use client";

import { useCallback } from "react";
import { ToolShell } from "@/components/ToolShell";
import { useToolRunner } from "@/lib/useToolRunner";
import type { Tool } from "@/lib/tools";

/**
 * Server-backed conversion tools.
 *
 * No options: the spec is explicit that we should not ask about DOCX versions,
 * OCR modes or layout preservation. One file in, one document out.
 */
export function ConvertTool({
  tool,
  target,
}: {
  tool: Tool;
  target: "docx" | "csv";
}) {
  const loadEngine = useCallback(async () => {
    const { createServerEngine } = await import("@/lib/serverEngine");
    return createServerEngine(target);
  }, [target]);

  const runner = useToolRunner({ tool, loadEngine });

  return <ToolShell tool={tool} runner={runner} />;
}
