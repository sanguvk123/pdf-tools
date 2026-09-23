"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { matchesAccept } from "@/lib/validate";
import type { Tool } from "@/lib/tools";

interface UploadDropzoneProps {
  tool: Tool;
  onFiles: (files: File[]) => void;
  /** Compact variant used for "Add more files" below an existing list. */
  compact?: boolean;
}

/**
 * The visual focus of every tool page. Supports drag and drop, the file
 * picker, and clipboard paste. There is no modal: the zone reacts in place.
 */
export function UploadDropzone({ tool, onFiles, compact = false }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Drag events fire for every child element, so depth-count to avoid flicker.
  const dragDepth = useRef(0);

  const emit = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const files = Array.from(list);
      onFiles(tool.multiple ? files : files.slice(0, 1));
    },
    [onFiles, tool.multiple],
  );

  // Clipboard paste: useful for screenshots on the image tools.
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const pasted = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        matchesAccept(file, tool.accept),
      );
      if (pasted.length === 0) return;

      event.preventDefault();
      onFiles(tool.multiple ? pasted : pasted.slice(0, 1));
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onFiles, tool.accept, tool.multiple]);

  function onDragEnter(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function onDragLeave(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    emit(event.dataTransfer.files);
  }

  const label = tool.multiple ? `Drop your ${tool.acceptLabel} files` : `Drop your ${tool.acceptLabel}`;

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        "relative rounded-2xl border-2 border-dashed text-center transition-colors duration-150",
        // Was py-14/sm:py-20, which left a tall empty box on every tool page.
        // Still a large drop target, without the dead space above and below.
        compact ? "px-4 py-5" : "px-6 py-9 sm:py-12",
        isDragging
          ? "border-accent bg-accent-soft"
          : "border-line-strong bg-surface hover:border-faint",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept={tool.accept}
        multiple={tool.multiple}
        onChange={(event) => {
          emit(event.target.files);
          // Reset so re-selecting the same file still fires a change event.
          event.target.value = "";
        }}
        className="sr-only"
        // Labelled by the visible button below, which is the real control.
        aria-hidden="true"
        tabIndex={-1}
      />

      {!compact && (
        <span
          aria-hidden="true"
          className={[
            "mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full transition-colors duration-150",
            isDragging ? "bg-accent text-white" : "bg-canvas text-muted",
          ].join(" ")}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M4 17v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
          </svg>
        </span>
      )}

      <p
        className={
          compact
            ? "text-[13.5px] text-muted"
            : "text-[16px] font-medium tracking-tight text-ink"
        }
      >
        {isDragging ? `Drop ${tool.acceptLabel} here` : label}
      </p>

      {!compact && <p className="mt-1 text-[13px] text-faint">or</p>}

      <div className={compact ? "mt-2" : "mt-3"}>
        <Button
          variant={compact ? "secondary" : "primary"}
          size={compact ? "md" : "lg"}
          onClick={() => inputRef.current?.click()}
        >
          {compact
            ? `Add more ${tool.acceptLabel}`
            : tool.multiple
              ? "Choose files"
              : `Choose ${tool.acceptLabel}`}
        </Button>
      </div>

      {!compact && (
        <p className="mt-4 text-[12.5px] text-faint">
          {tool.acceptLabel} up to {tool.maxFileSizeMb} MB
        </p>
      )}
    </div>
  );
}
