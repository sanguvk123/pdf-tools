"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { FileList } from "@/components/FileList";
import { RelatedTools } from "@/components/RelatedTools";
import { UploadDropzone } from "@/components/UploadDropzone";
import {
  ErrorState,
  PasswordPrompt,
  ProcessingState,
  SuccessState,
} from "@/components/ToolStates";
import { downloadOutputs } from "@/lib/download";
import { track } from "@/lib/analytics";
import { stripExtension } from "@/lib/format";
import type { Tool } from "@/lib/tools";
import type { ToolRunner } from "@/lib/useToolRunner";

interface ToolShellProps {
  tool: Tool;
  runner: ToolRunner;
  /**
   * Tool-specific controls, revealed only once files are ready. Receives the
   * runner so options can read and write state.
   */
  options?: ReactNode;
  /** Set for tools whose purpose is to change file size. */
  showSizeDelta?: boolean;
  /** Blocks the primary action, e.g. when no pages are selected yet. */
  actionDisabled?: boolean;
}

/**
 * The universal tool layout.
 *
 * Renders exactly one state at a time, so the user is never looking at a dead
 * screen, and every tool presents the same sequence: upload → options →
 * action → result.
 */
export function ToolShell({
  tool,
  runner,
  options,
  showSizeDelta = false,
  actionDisabled = false,
}: ToolShellProps) {
  const { state } = runner;

  useEffect(() => {
    track("tool_view", { tool: tool.slug, engine: tool.engine });
  }, [tool.slug, tool.engine]);

  const hasFiles = state.files.length > 0;
  const showWorkspace =
    hasFiles && (state.status === "VALIDATING" || state.status === "READY");

  async function handleDownload() {
    if (!state.result) return;

    track("download_clicked", { tool: tool.slug, engine: tool.engine });

    const base = stripExtension(state.files[0]?.name ?? tool.slug);
    await downloadOutputs(state.result.outputs, `${base}-${tool.slug}.zip`);

    runner.markDownloaded();
  }

  return (
    <div className="mx-auto max-w-xl px-5 pt-10 pb-8 sm:pt-16">
      <header className="text-center">
        <h1 className="text-[27px] leading-tight font-semibold tracking-[-0.03em] sm:text-[32px]">
          {tool.heading}
        </h1>
        <p className="mx-auto mt-2 max-w-[42ch] text-[14.5px] text-muted">
          {tool.subtitle}
        </p>
      </header>

      <div className="mt-8">
        {/* IDLE — the upload zone is the visual focus. */}
        {!hasFiles && state.status !== "ERROR" && (
          <>
            <UploadDropzone tool={tool} onFiles={runner.selectFiles} />
            <p className="mt-4 text-center text-[12.5px] text-faint">
              Private · Secure · No signup
            </p>
          </>
        )}

        {/* FILE_SELECTED / READY — files plus the relevant options. */}
        {showWorkspace && (
          <div className="animate-rise space-y-5">
            <FileList
              files={state.files}
              onChange={runner.changeFiles}
              reorderable={tool.multiple}
            />

            {tool.multiple && (
              <UploadDropzone tool={tool} onFiles={(files) =>
                runner.changeFiles([...state.files, ...files])
              } compact />
            )}

            {options}

            <div className="hidden sm:block">
              <Button
                size="lg"
                fullWidth
                onClick={runner.run}
                disabled={actionDisabled || state.status === "VALIDATING"}
              >
                {tool.action}
              </Button>
            </div>

            {/* Sticky CTA keeps the primary action reachable on mobile. */}
            <div className="sticky bottom-0 -mx-5 border-t border-line bg-canvas/90 px-5 py-3 backdrop-blur-md sm:hidden">
              <Button
                size="lg"
                fullWidth
                onClick={runner.run}
                disabled={actionDisabled || state.status === "VALIDATING"}
              >
                {tool.action}
              </Button>
            </div>
          </div>
        )}

        {state.status === "PASSWORD_REQUIRED" && (
          <PasswordPrompt
            wrongPassword={state.error?.code === "WRONG_PASSWORD"}
            onSubmit={runner.submitPassword}
            onCancel={runner.reset}
          />
        )}

        {state.status === "PROCESSING" && (
          <ProcessingState
            title={tool.actionProgressive}
            progress={state.progress}
            onCancel={runner.cancel}
          />
        )}

        {state.status === "SUCCESS" && state.result && (
          <>
            <SuccessState
              headline={tool.successHeadline}
              result={state.result}
              showSizeDelta={showSizeDelta}
              onDownload={handleDownload}
              onReset={runner.reset}
              resetLabel={`${tool.action} again`}
            />

            {/* Offer the next step only once the user has their file. */}
            {state.downloaded && (
              <div className="animate-rise mt-6">
                <RelatedTools
                  slug={tool.slug}
                  title="Done with this file?"
                  compact
                />
              </div>
            )}
          </>
        )}

        {state.status === "ERROR" && state.error && (
          <ErrorState error={state.error} onRetry={runner.reset} />
        )}
      </div>
    </div>
  );
}
