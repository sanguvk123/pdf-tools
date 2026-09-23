"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { ContinueWith } from "@/components/ContinueWith";
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
import { takeHandoff } from "@/lib/handoff";
import { matchesAccept } from "@/lib/validate";
import { Icon } from "@/components/Icon";
import { CATEGORY_STYLES, type Tool } from "@/lib/tools";
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
  /**
   * Set to false when a wrapping landing page supplies its own <h1>.
   *
   * A page must have exactly one h1 so it is unambiguous which query it
   * answers. Rendering a second one and hiding it with sr-only would not
   * help: that hides it visually but leaves it in the DOM, where crawlers
   * and screen readers still find it.
   */
  showHeading?: boolean;
}

/** Wraps a single output Blob as a File, ready to feed into the next tool. */
function fileFromOutput(result: { outputs: { filename: string; blob: Blob }[] }): File {
  const output = result.outputs[0];
  return new File([output.blob], output.filename, { type: output.blob.type });
}

/**
 * States, in plain language, where the file actually goes.
 *
 * Previously every tool showed the same "Private · Secure · No signup" line,
 * including the conversions that upload to our server. The disclosure existed
 * further down the page, but the reassuring badge sat right beside the upload
 * button — so the prominent claim and the accurate one disagreed. Reading the
 * engine from the registry means the badge cannot drift from the truth when a
 * tool changes where it runs.
 */
function PrivacyNote({ engine }: { engine: Tool["engine"] }) {
  const local = engine === "client";

  return (
    <p
      className={[
        "mt-4 flex items-center justify-center gap-1.5 text-center text-[12.5px]",
        local ? "text-success" : "text-muted",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
      {local ? (
        <span>
          <strong className="font-medium">Stays on your device.</strong> This
          tool runs in your browser — nothing is uploaded.
        </span>
      ) : (
        <span>
          <strong className="font-medium">Uploaded securely.</strong> This
          conversion needs a server; your file is deleted straight after.
        </span>
      )}
    </p>
  );
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
  showHeading = true,
}: ToolShellProps) {
  const { state } = runner;

  useEffect(() => {
    track("tool_view", { tool: tool.slug, engine: tool.engine });
  }, [tool.slug, tool.engine]);

  // Pick up a file handed over by the previous tool, so the user does not have
  // to find and re-upload something they just produced. Runs once per mount:
  // takeHandoff clears the file, and the ref guards against Strict Mode's
  // double-invoked effects consuming it twice.
  const claimedHandoff = useRef(false);
  const { selectFiles } = runner;

  useEffect(() => {
    if (claimedHandoff.current) return;
    claimedHandoff.current = true;

    const handoff = takeHandoff();
    if (!handoff) return;

    // The previous tool filtered by accept, but a stale handoff could still
    // arrive at a tool that cannot use it. Re-check rather than trust it.
    if (!matchesAccept(handoff.file, tool.accept)) return;

    selectFiles([handoff.file]);
    track("file_selected", { tool: tool.slug, source: "handoff" });
  }, [tool.accept, tool.slug, selectFiles]);

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
    <div
      className={
        showHeading
          ? "mx-auto max-w-xl px-5 pt-7 pb-7 sm:pt-10"
          : "mx-auto max-w-xl px-5 pb-7"
      }
    >
      {showHeading && (
        <header className="text-center">
          {/* The tool's own icon, tinted by category — it identifies the page
              at a glance and ties it to the card the user clicked. */}
          <span
            className={`mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl ${CATEGORY_STYLES[tool.category].tile}`}
          >
            <Icon name={tool.icon} className="h-[22px] w-[22px]" />
          </span>
          <h1 className="text-[27px] leading-tight font-semibold tracking-[-0.03em] sm:text-[32px]">
            {tool.heading}
          </h1>
          <p className="mx-auto mt-2 max-w-[42ch] text-[14.5px] text-muted">
            {tool.subtitle}
          </p>
        </header>
      )}

      <div className="mt-6">
        {/* IDLE — the upload zone is the visual focus. */}
        {!hasFiles && state.status !== "ERROR" && (
          <>
            <UploadDropzone tool={tool} onFiles={runner.selectFiles} />
            <PrivacyNote engine={tool.engine} />
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
            {state.downloaded &&
              (state.result.outputs.length === 1 ? (
                /* One output can be carried straight into the next tool.
                   With several, "continue" is ambiguous, so just link out. */
                <ContinueWith tool={tool} file={fileFromOutput(state.result)} />
              ) : (
                <div className="animate-rise mt-6">
                  <RelatedTools
                    slug={tool.slug}
                    title="Done with this file?"
                    compact
                  />
                </div>
              ))}
          </>
        )}

        {state.status === "ERROR" && state.error && (
          <ErrorState error={state.error} onRetry={runner.reset} />
        )}
      </div>
    </div>
  );
}
