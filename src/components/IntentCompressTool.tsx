"use client";

import { useCallback } from "react";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { useToolRunner } from "@/lib/useToolRunner";
import type { CompressionLevel } from "@/workers/pdfOperations";

const TOOL = requireTool("compress-pdf");

/**
 * Compression with the strength chosen by the landing page's intent.
 *
 * No strength selector: the URL already expressed the preference, so asking
 * again would undo the reason the visitor landed here instead of on the
 * general Compress PDF page.
 */
export function IntentCompressTool({
  level,
  showHeading = true,
}: {
  level: CompressionLevel;
  /** False when the landing page supplies the page's single <h1>. */
  showHeading?: boolean;
}) {
  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("compress");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    defaultOptions: { level },
    loadEngine,
  });

  return (
    <ToolShell
      tool={TOOL}
      runner={runner}
      showSizeDelta
      showHeading={showHeading}
    />
  );
}
