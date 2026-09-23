"use client";

import { useCallback } from "react";
import { OptionSelector } from "@/components/OptionSelector";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { useToolRunner } from "@/lib/useToolRunner";

const TOOL = requireTool("compress-pdf");

/**
 * Compression strength in plain language. The user should never see DPI,
 * quality factors or algorithm names — only the outcome they care about.
 */
const LEVELS = [
  {
    value: "recommended",
    label: "Recommended",
    hint: "Great quality, much smaller",
  },
  { value: "smaller", label: "Smaller", hint: "Smaller file, some quality loss" },
  { value: "smallest", label: "Smallest", hint: "Maximum compression" },
];

export function CompressTool() {
  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("compress");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    // Recommended is pre-selected, so the user can act without deciding.
    defaultOptions: { level: "recommended" },
    loadEngine,
  });

  return (
    <ToolShell
      tool={TOOL}
      runner={runner}
      showSizeDelta
      options={
        <OptionSelector
          legend="Compression"
          options={LEVELS}
          value={runner.state.options.level as string}
          onChange={(value) => runner.setOption("level", value)}
        />
      }
    />
  );
}
