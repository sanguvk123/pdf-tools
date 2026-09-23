"use client";

import { useCallback, useState } from "react";
import { OptionSelector } from "@/components/OptionSelector";
import { PagePicker } from "@/components/PagePicker";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { usePageCount } from "@/lib/usePageCount";
import { useToolRunner } from "@/lib/useToolRunner";

const TOOL = requireTool("split-pdf");

const MODES = [
  {
    value: "extract",
    label: "Extract selected pages",
    hint: "Save the pages you pick as one new PDF",
  },
  {
    value: "every-page",
    label: "Split every page",
    hint: "One PDF per page, delivered as a ZIP",
  },
];

export function SplitTool() {
  const [pages, setPages] = useState<number[]>([]);

  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("split");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    defaultOptions: { mode: "extract", pages: [], ranges: "" },
    loadEngine,
  });

  const pageCount = usePageCount(runner.state.files[0]);
  const mode = runner.state.options.mode as string;
  const needsSelection = mode === "extract";

  function updatePages(next: number[]) {
    setPages(next);
    runner.setOption("pages", next);
  }

  return (
    <ToolShell
      tool={TOOL}
      runner={runner}
      actionDisabled={needsSelection && pages.length === 0}
      options={
        <div className="space-y-5">
          <OptionSelector
            legend="How would you like to split it?"
            options={MODES}
            value={mode}
            onChange={(value) => runner.setOption("mode", value)}
          />

          {/* Progressive disclosure: the picker only matters when extracting. */}
          {needsSelection && pageCount > 0 && (
            <PagePicker
              legend="Select the pages you want"
              pageCount={pageCount}
              selected={pages}
              onChange={updatePages}
            />
          )}
        </div>
      }
    />
  );
}
