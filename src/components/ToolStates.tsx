"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { track } from "@/lib/analytics";
import { formatBytes, reductionPercent } from "@/lib/format";
import type { ToolProgress, ToolResult } from "@/lib/types";
import { recoveryAction, type ErrorCopy, type ToolErrorCode } from "@/lib/errors";

/* ---------------- Processing ---------------- */

interface ProcessingStateProps {
  /** "Compressing your PDF" — human, present tense. */
  title: string;
  progress: ToolProgress | null;
  onCancel: () => void;
}

/**
 * Honest progress. When the engine reports a real ratio we draw a determinate
 * bar; otherwise we show an indeterminate one. We never invent a percentage.
 */
export function ProcessingState({ title, progress, onCancel }: ProcessingStateProps) {
  const [elapsed, setElapsed] = useState(0);
  const hasRatio = typeof progress?.ratio === "number";
  const percent = hasRatio ? Math.round((progress?.ratio ?? 0) * 100) : null;

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="animate-rise rounded-2xl border border-line bg-surface p-6 text-center">
      <p className="text-[16px] font-medium tracking-tight">{title}</p>

      <p aria-live="polite" className="mt-1 text-[13.5px] text-muted">
        {progress?.stage ?? "Starting"}
        {percent !== null ? ` · ${percent}%` : ""}
      </p>

      <div
        role="progressbar"
        aria-label={title}
        aria-valuenow={percent ?? undefined}
        aria-valuemin={percent !== null ? 0 : undefined}
        aria-valuemax={percent !== null ? 100 : undefined}
        className="relative mx-auto mt-5 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-line"
      >
        {percent !== null ? (
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
            style={{ width: `${percent}%` }}
          />
        ) : (
          <div className="animate-indeterminate h-full w-1/4 rounded-full bg-accent" />
        )}
      </div>

      {/* Only reassure about waiting once the wait is actually long. */}
      {elapsed >= 10 && (
        <p className="mt-4 text-[12.5px] text-faint">
          This one is taking a little longer. You can keep this tab open — we will
          let you know when it is ready.
        </p>
      )}

      <div className="mt-5">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Success ---------------- */

interface SuccessStateProps {
  headline: string;
  result: ToolResult;
  /** Shown when the tool's job is to change file size. */
  showSizeDelta?: boolean;
  onDownload: () => void;
  onReset: () => void;
  resetLabel: string;
}

export function SuccessState({
  headline,
  result,
  showSizeDelta = false,
  onDownload,
  onReset,
  resetLabel,
}: SuccessStateProps) {
  const saved = reductionPercent(result.inputBytes, result.outputBytes);
  const fileCount = result.outputs.length;

  return (
    <div className="animate-rise rounded-2xl border border-line bg-surface p-8 text-center">
      <span
        aria-hidden="true"
        className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-success-soft text-success"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
      </span>

      <p className="mt-3 text-[13px] font-medium text-success">Done</p>
      <h2 className="mt-1 text-[20px] font-semibold tracking-tight">{headline}</h2>

      {showSizeDelta ? (
        /* The size change is the whole point of these tools, so it is the
           largest thing on the screen rather than a footnote. Stacked so the
           drop reads vertically at a glance. */
        <div className="mt-5">
          <p className="text-[15px] text-muted line-through tabular-nums decoration-faint/60">
            {formatBytes(result.inputBytes)}
          </p>
          <p
            aria-hidden="true"
            className="mx-auto my-0.5 h-4 w-px bg-line-strong"
          />
          <p className="text-[30px] leading-none font-semibold tracking-tight tabular-nums">
            {formatBytes(result.outputBytes)}
          </p>

          {saved > 0 ? (
            <p className="mt-3 inline-block rounded-full bg-success-soft px-3 py-1 text-[13px] font-medium text-success">
              {saved}% smaller
            </p>
          ) : (
            /* Never dress up a non-result as a win. */
            <p className="mt-3 text-[13px] text-muted">
              This file was already as small as it gets
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-[13.5px] text-muted">
          {fileCount === 1
            ? formatBytes(result.outputBytes)
            : `${fileCount} files · ${formatBytes(result.outputBytes)}`}
        </p>
      )}

      {result.note && (
        <p className="mx-auto mt-3 max-w-[40ch] text-[12.5px] text-faint">
          {result.note}
        </p>
      )}

      <div className="mt-6">
        <Button size="lg" onClick={onDownload} className="w-full sm:w-auto sm:min-w-52">
          {fileCount === 1 ? "Download" : `Download ${fileCount} files`}
        </Button>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-[13px] text-muted transition-colors duration-150 hover:text-ink"
      >
        {resetLabel}
      </button>
    </div>
  );
}

/* ---------------- Error ---------------- */

interface ErrorStateProps {
  error: ErrorCopy & { code: ToolErrorCode };
  onRetry: () => void;
  /** The tool that failed, so a suggestion never points back at itself. */
  toolSlug: string;
}

export function ErrorState({ error, onRetry, toolSlug }: ErrorStateProps) {
  const action = recoveryAction(error.code, { slug: toolSlug });

  return (
    <div
      role="alert"
      className="animate-rise rounded-2xl border border-line bg-surface p-8 text-center"
    >
      <span
        aria-hidden="true"
        className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-danger-soft text-danger"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M12 8v5" />
          <path d="M12 16.5v.01" />
        </svg>
      </span>

      <h2 className="mt-3 text-[17px] font-semibold tracking-tight">{error.title}</h2>
      <p className="mx-auto mt-1.5 max-w-[40ch] text-[13.5px] text-muted">
        {error.body}
      </p>

      <div className="mt-6">
        <Button variant="secondary" onClick={onRetry}>
          Try another file
        </Button>
      </div>

      {/* An accurate explanation still leaves the user stuck. Where another
          tool can genuinely succeed with the same file — a scan that will
          never convert to text but rasterises fine — offer it here rather
          than making them work out the alternative themselves. */}
      {action && (
        <div className="mt-5 border-t border-line pt-5">
          <p className="mx-auto max-w-[42ch] text-[12.5px] text-muted">
            {action.reason}
          </p>
          <Link
            href={action.href}
            onClick={() =>
              track("error_recovery_clicked", {
                code: error.code,
                to: action.href,
              })
            }
            className="mt-2.5 inline-block text-[13.5px] font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
          >
            {action.label} →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ---------------- Password ---------------- */

interface PasswordPromptProps {
  onSubmit: (password: string) => void;
  onCancel: () => void;
  /** True after a rejected attempt, to show the retry message. */
  wrongPassword?: boolean;
}

export function PasswordPrompt({
  onSubmit,
  onCancel,
  wrongPassword = false,
}: PasswordPromptProps) {
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Detected before any processing happens, so focus straight to the field.
  useEffect(() => inputRef.current?.focus(), []);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (password) onSubmit(password);
      }}
      className="animate-rise rounded-2xl border border-line bg-surface p-6 text-center"
    >
      <span
        aria-hidden="true"
        className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-canvas text-muted"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </span>

      <h2 className="mt-3 text-[16px] font-semibold tracking-tight">
        This PDF is password protected
      </h2>
      <p className="mt-1.5 text-[13.5px] text-muted">
        {wrongPassword
          ? "That password didn't work. Check for typos and try again."
          : "Enter the password to continue."}
      </p>

      <label htmlFor="pdf-password" className="sr-only">
        PDF password
      </label>
      <input
        ref={inputRef}
        id="pdf-password"
        type="password"
        value={password}
        autoComplete="off"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="mx-auto mt-4 block h-11 w-full max-w-xs rounded-xl border border-line-strong bg-canvas px-3.5 text-center text-[14px] outline-none transition-colors duration-150 focus:border-accent"
      />

      <div className="mt-4 flex flex-col-reverse items-center justify-center gap-2 sm:flex-row">
        <Button variant="ghost" onClick={onCancel}>
          Use another file
        </Button>
        <Button type="submit" disabled={!password} className="w-full sm:w-auto">
          Continue
        </Button>
      </div>

      <p className="mt-4 text-[12px] text-faint">
        Your password is used on your device only and is never sent anywhere.
      </p>
    </form>
  );
}
