"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { describeError, ToolError } from "@/lib/errors";
import { sizeBucketKb, track } from "@/lib/analytics";
import { isEncryptedPdf, isProbablyPdf, validateFiles } from "@/lib/validate";
import {
  createInitialState,
  toolReducer,
  type ToolState,
} from "@/lib/toolMachine";
import type { Tool } from "@/lib/tools";
import type { ProgressHandler, ToolResult } from "@/lib/types";

/** The engine a page supplies. Loaded lazily so heavy code stays off the route. */
export type RunFn = (
  args: {
    files: File[];
    options: Record<string, unknown>;
    password?: string;
  },
  onProgress: ProgressHandler,
  signal: AbortSignal,
) => Promise<ToolResult>;

interface UseToolRunnerArgs {
  tool: Tool;
  defaultOptions?: Record<string, unknown>;
  /**
   * Returns the engine. Called on first run, and given a chance to warm up as
   * soon as a file is selected, so the library download overlaps the user
   * reading the options rather than delaying the click.
   */
  loadEngine: () => Promise<RunFn>;
}

export interface ToolRunner {
  state: ToolState;
  selectFiles: (files: File[]) => void;
  changeFiles: (files: File[]) => void;
  setOption: (key: string, value: unknown) => void;
  submitPassword: (password: string) => void;
  run: () => void;
  cancel: () => void;
  reset: () => void;
  markDownloaded: () => void;
}

/**
 * Orchestrates the whole tool lifecycle: validation, optimistic engine
 * preloading, execution, cancellation, progress and funnel analytics.
 *
 * Pages stay declarative — they describe options and layout, and this hook
 * guarantees every tool behaves identically.
 */
export function useToolRunner({
  tool,
  defaultOptions = {},
  loadEngine,
}: UseToolRunnerArgs): ToolRunner {
  const initial = useMemo(
    () => createInitialState(defaultOptions),
    // Default options are static per page; recomputing would reset state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [state, dispatch] = useReducer(toolReducer, initial);

  const abortRef = useRef<AbortController | null>(null);
  const enginePromise = useRef<Promise<RunFn> | null>(null);
  const startedAt = useRef(0);
  // Guards against a resolved run dispatching after unmount.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const warmEngine = useCallback(() => {
    // Begin fetching the engine chunk immediately; failures surface at run time.
    enginePromise.current ??= loadEngine();
    enginePromise.current.catch(() => {
      enginePromise.current = null;
    });
  }, [loadEngine]);

  const selectFiles = useCallback(
    (files: File[]) => {
      // Acknowledge instantly, then validate — the file name appears at once.
      dispatch({ type: "FILES_SELECTED", files });

      track("file_selected", {
        tool: tool.slug,
        engine: tool.engine,
        fileCount: files.length,
        fileSizeBucketKb: sizeBucketKb(
          files.reduce((total, file) => total + file.size, 0),
        ),
      });

      void (async () => {
        try {
          validateFiles(files, tool);

          // Verify PDFs really are PDFs, and detect encryption up front rather
          // than letting the user wait and then fail.
          if (tool.accept.includes("pdf")) {
            for (const file of files) {
              if (!(await isProbablyPdf(file))) {
                throw new ToolError(
                  "CORRUPT_FILE",
                  `${file.name} doesn't look like a valid PDF.`,
                );
              }
            }

            if (await isEncryptedPdf(files[0])) {
              if (!mounted.current) return;
              dispatch({ type: "PASSWORD_REQUIRED" });
              return;
            }
          }

          if (!mounted.current) return;
          dispatch({ type: "FILES_VALIDATED" });
          warmEngine();
        } catch (error) {
          if (!mounted.current) return;
          dispatch({ type: "FAILED", error: describeError(error) });
          track("processing_failed", {
            tool: tool.slug,
            errorCode: describeError(error).code,
          });
        }
      })();
    },
    [tool, warmEngine],
  );

  const changeFiles = useCallback((files: File[]) => {
    dispatch({ type: "FILES_CHANGED", files });
  }, []);

  const setOption = useCallback((key: string, value: unknown) => {
    dispatch({ type: "OPTION_CHANGED", key, value });
  }, []);

  const submitPassword = useCallback((password: string) => {
    dispatch({ type: "PASSWORD_SUBMITTED", password });
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    track("processing_cancelled", { tool: tool.slug });
  }, [tool.slug]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  const markDownloaded = useCallback(() => {
    dispatch({ type: "DOWNLOADED" });
    track("download_completed", { tool: tool.slug });
  }, [tool.slug]);

  const run = useCallback(() => {
    const { files, options, password } = state;
    if (files.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;
    startedAt.current = performance.now();

    dispatch({ type: "PROCESSING_STARTED" });
    track("processing_started", {
      tool: tool.slug,
      engine: tool.engine,
      fileCount: files.length,
      fileSizeBucketKb: sizeBucketKb(
        files.reduce((total, file) => total + file.size, 0),
      ),
    });

    const onProgress: ProgressHandler = (progress) => {
      if (mounted.current && !controller.signal.aborted) {
        dispatch({ type: "PROGRESS", progress });
      }
    };

    void (async () => {
      try {
        warmEngine();
        const engine = await enginePromise.current!;
        const result = await engine(
          { files, options, password: password ?? undefined },
          onProgress,
          controller.signal,
        );

        if (!mounted.current || controller.signal.aborted) return;

        dispatch({ type: "SUCCEEDED", result });
        track("processing_completed", {
          tool: tool.slug,
          engine: tool.engine,
          durationMs: Math.round(performance.now() - startedAt.current),
          fileSizeBucketKb: sizeBucketKb(result.outputBytes),
        });
      } catch (error) {
        if (!mounted.current) return;

        const described = controller.signal.aborted
          ? describeError(new ToolError("CANCELLED"))
          : describeError(error);

        dispatch({ type: "FAILED", error: described });

        if (described.code !== "CANCELLED") {
          track("processing_failed", {
            tool: tool.slug,
            engine: tool.engine,
            errorCode: described.code,
            durationMs: Math.round(performance.now() - startedAt.current),
          });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    })();
  }, [state, tool.slug, tool.engine, warmEngine]);

  return {
    state,
    selectFiles,
    changeFiles,
    setOption,
    submitPassword,
    run,
    cancel,
    reset,
    markDownloaded,
  };
}
