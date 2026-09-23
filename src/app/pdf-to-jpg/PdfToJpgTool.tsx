"use client";

import { useCallback } from "react";
import { OptionSelector } from "@/components/OptionSelector";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { useToolRunner } from "@/lib/useToolRunner";

const TOOL = requireTool("pdf-to-jpg");

const FORMATS = [
  { value: "jpeg", label: "JPG", hint: "Smaller files, ideal for photos and scans" },
  { value: "png", label: "PNG", hint: "Larger files, sharper text and line art" },
];

export function PdfToJpgTool() {
  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("pdf-to-image");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    // scale 2 renders at roughly 150 DPI, the sweet spot for screen and print.
    defaultOptions: { format: "jpeg", scale: 2, quality: 0.92 },
    loadEngine,
  });

  return (
    <ToolShell
      tool={TOOL}
      runner={runner}
      options={
        <OptionSelector
          legend="Image format"
          options={FORMATS}
          value={runner.state.options.format as string}
          onChange={(value) => runner.setOption("format", value)}
        />
      }
    />
  );
}
