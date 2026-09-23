"use client";

import { useCallback } from "react";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { useToolRunner } from "@/lib/useToolRunner";

const TOOL = requireTool("pdf-to-png");

/**
 * PDF → PNG.
 *
 * Shares the render engine with PDF → JPG but fixes the format to PNG. The
 * URL already states the intent, so offering a format switch here would ask
 * the user to re-make a decision they made in the search box.
 */
export function PdfToPngTool() {
  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("pdf-to-image");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    // scale 2 renders at roughly 150 DPI. PNG is lossless, so quality is unused.
    defaultOptions: { format: "png", scale: 2, quality: 1 },
    loadEngine,
  });

  return <ToolShell tool={TOOL} runner={runner} />;
}
