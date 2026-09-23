"use client";

import { useCallback } from "react";
import { ToolShell } from "@/components/ToolShell";
import { requireTool } from "@/lib/tools";
import { useToolRunner } from "@/lib/useToolRunner";
import { formatBytes } from "@/lib/format";
import type { CompressTarget } from "@/lib/compressTargets";

const TOOL = requireTool("compress-pdf");

/**
 * Compression aimed at a specific size limit.
 *
 * The strength is chosen for the target, so there is nothing to configure —
 * the user arrived knowing exactly what they need. We state plainly whether
 * the result met the goal rather than implying a guarantee we cannot make.
 */
export function TargetCompressTool({
  target,
  showHeading = true,
}: {
  target: CompressTarget;
  /** False when the landing page supplies the page's single <h1>. */
  showHeading?: boolean;
}) {
  const loadEngine = useCallback(async () => {
    const { createClientEngine } = await import("@/lib/clientEngine");
    return createClientEngine("compress");
  }, []);

  const runner = useToolRunner({
    tool: TOOL,
    defaultOptions: { level: target.level },
    loadEngine,
  });

  const result = runner.state.result;
  const metTarget = result ? result.outputBytes <= target.bytes : false;

  return (
    <>
      <ToolShell
        tool={TOOL}
        runner={runner}
        showSizeDelta
        showHeading={showHeading}
      />

      {result && (
        <div className="mx-auto -mt-2 max-w-xl px-5">
          <p
            className={[
              "rounded-xl border px-4 py-3 text-center text-[13px]",
              metTarget
                ? "border-success/20 bg-success-soft text-success"
                : "border-line bg-surface text-muted",
            ].join(" ")}
          >
            {metTarget
              ? `Under ${target.label} — ready to send.`
              : `This one came out at ${formatBytes(result.outputBytes)}, above ${target.label}. Splitting the document or removing pages will get you the rest of the way.`}
          </p>
        </div>
      )}
    </>
  );
}
