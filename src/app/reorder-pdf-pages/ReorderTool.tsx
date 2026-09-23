"use client";

import { useCallback, useState } from "react";
import { PageOrderEditor } from "@/components/PageOrderEditor";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { usePageCount } from "@/lib/usePageCount";
import { useToolRunner } from "@/lib/useToolRunner";

const TOOL = requireTool("reorder-pdf-pages");

function sequence(length: number): number[] {
  return Array.from({ length }, (_, index) => index + 1);
}

export function ReorderTool() {
  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("reorder");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    defaultOptions: { order: [] },
    loadEngine,
  });

  const pageCount = usePageCount(runner.state.files[0]);

  // The order is derived from the page count until the user moves something.
  // Holding the count alongside the edit lets a new file reset the order
  // without synchronising state from an effect, which would cause a second
  // render pass on every file selection.
  const [edited, setEdited] = useState<{ count: number; order: number[] } | null>(
    null,
  );
  const order =
    edited?.count === pageCount ? edited.order : sequence(pageCount);

  const unchanged = order.every((page, index) => page === index + 1);

  return (
    <ToolShell
      tool={TOOL}
      runner={runner}
      // Saving an unchanged order would hand back an identical file while
      // implying work was done.
      actionDisabled={pageCount === 0 || unchanged}
      options={
        pageCount > 1 ? (
          <PageOrderEditor
            order={order}
            onChange={(next) => {
              setEdited({ count: pageCount, order: next });
              runner.setOption("order", next);
            }}
          />
        ) : null
      }
    />
  );
}
