"use client";

import { useCallback, useState } from "react";
import { PagePicker } from "@/components/PagePicker";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { usePageCount } from "@/lib/usePageCount";
import { useToolRunner } from "@/lib/useToolRunner";

const TOOL = requireTool("extract-pages-pdf");

export function ExtractPagesTool() {
  const [pages, setPages] = useState<number[]>([]);

  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("extract-pages");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    defaultOptions: { pages: [] },
    loadEngine,
  });

  const pageCount = usePageCount(runner.state.files[0]);

  return (
    <ToolShell
      tool={TOOL}
      runner={runner}
      actionDisabled={pages.length === 0}
      options={
        pageCount > 0 ? (
          <PagePicker
            legend="Select the pages to keep"
            pageCount={pageCount}
            selected={pages}
            onChange={(next) => {
              setPages(next);
              runner.setOption("pages", next);
            }}
          />
        ) : null
      }
    />
  );
}
