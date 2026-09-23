"use client";

import { useCallback, useState } from "react";
import { OptionSelector } from "@/components/OptionSelector";
import { PagePicker } from "@/components/PagePicker";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { usePageCount } from "@/lib/usePageCount";
import { useToolRunner } from "@/lib/useToolRunner";

const TOOL = requireTool("rotate-pdf");

const ANGLES = [
  { value: "90", label: "Rotate right", hint: "90° clockwise" },
  { value: "270", label: "Rotate left", hint: "90° anticlockwise" },
  { value: "180", label: "Turn upside down", hint: "180°" },
];

export function RotateTool() {
  const [pages, setPages] = useState<number[]>([]);

  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("rotate");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    // No page selection means "every page", which is the common case.
    defaultOptions: { angle: 90, pages: [] },
    loadEngine,
  });

  const pageCount = usePageCount(runner.state.files[0]);

  return (
    <ToolShell
      tool={TOOL}
      runner={runner}
      options={
        <div className="space-y-5">
          <OptionSelector
            legend="Which way?"
            options={ANGLES}
            value={String(runner.state.options.angle)}
            onChange={(value) => runner.setOption("angle", Number(value))}
          />

          {pageCount > 1 && (
            <PagePicker
              legend="Pages to rotate (all pages if none selected)"
              pageCount={pageCount}
              selected={pages}
              onChange={(next) => {
                setPages(next);
                runner.setOption("pages", next);
              }}
            />
          )}
        </div>
      }
    />
  );
}
