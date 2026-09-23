"use client";

import { useCallback } from "react";
import { OptionSelector } from "@/components/OptionSelector";
import { ToolShell } from "@/components/ToolShell";
import { useToolRunner } from "@/lib/useToolRunner";
import type { Tool } from "@/lib/tools";

const PAGE_SIZES = [
  {
    value: "auto",
    label: "Match each image",
    hint: "Every page is exactly the size of its image",
  },
  { value: "a4", label: "A4", hint: "Standard page size, centred with a margin" },
  { value: "letter", label: "Letter", hint: "US page size, centred with a margin" },
];

/**
 * Shared by /jpg-to-pdf and /image-to-pdf. The two routes differ only in
 * which file types they accept and how they are described, both of which come
 * from the registry — so the behaviour is guaranteed to stay identical.
 */
export function ImagesToPdfTool({ tool }: { tool: Tool }) {
  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("images-to-pdf");
  }, []);

  const runner = useToolRunner({
    tool,
    defaultOptions: { pageSize: "auto", margin: 36 },
    loadEngine,
  });

  return (
    <ToolShell
      tool={tool}
      runner={runner}
      options={
        <OptionSelector
          legend="Page size"
          options={PAGE_SIZES}
          value={runner.state.options.pageSize as string}
          onChange={(value) => runner.setOption("pageSize", value)}
        />
      }
    />
  );
}
