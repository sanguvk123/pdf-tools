"use client";

import { useState } from "react";
import { formatBytes } from "@/lib/format";
import { usePageCounts } from "@/lib/usePageCounts";

interface FileListProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Merge-style tools need ordering; single-file tools do not. */
  reorderable?: boolean;
  disabled?: boolean;
}

/**
 * Selected files, shown the instant they are chosen so the user gets
 * immediate acknowledgement. Reordering works by pointer drag and by keyboard
 * via the move buttons, so the tool is fully usable without a mouse.
 */
export function FileList({
  files,
  onChange,
  reorderable = false,
  disabled = false,
}: FileListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const pageCounts = usePageCounts(files);

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  // Zero until every count has arrived, so the total never briefly displays a
  // partial sum that looks like a miscalculation.
  const allCounted = files.every((file) => pageCounts.has(file));
  const totalPages = allCounted
    ? files.reduce((sum, file) => sum + (pageCounts.get(file) ?? 0), 0)
    : 0;

  function move(from: number, to: number) {
    if (to < 0 || to >= files.length || from === to) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(index: number) {
    onChange(files.filter((_, position) => position !== index));
  }

  return (
    <ul className="space-y-2">
      {files.map((file, index) => {
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== index;

        return (
          <li
            key={`${file.name}-${file.lastModified}-${index}`}
            draggable={reorderable && !disabled}
            onDragStart={() => setDragIndex(index)}
            onDragEnter={() => setOverIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragIndex !== null) move(dragIndex, index);
              setDragIndex(null);
              setOverIndex(null);
            }}
            className={[
              "flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 transition-all duration-150",
              isOver ? "border-accent" : "border-line",
              isDragging ? "opacity-50" : "",
            ].join(" ")}
          >
            {reorderable && (
              <span
                aria-hidden="true"
                className="w-4 shrink-0 text-center text-[12px] text-faint tabular-nums"
              >
                {index + 1}
              </span>
            )}

            <span
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-muted"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
              </svg>
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium text-ink">
                {file.name}
              </span>
              <span className="block text-[12px] text-faint">
                {formatBytes(file.size)}
                {/* Omitted rather than shown as "0 pages" while the count is
                    still being read, or when the file could not be parsed —
                    a wrong number is worse than a missing one. */}
                {(pageCounts.get(file) ?? 0) > 0 && (
                  <>
                    {" · "}
                    {pageCounts.get(file)}{" "}
                    {pageCounts.get(file) === 1 ? "page" : "pages"}
                  </>
                )}
              </span>
            </span>

            {reorderable && files.length > 1 && (
              <span className="flex shrink-0 items-center">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label={`Move ${file.name} up`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors duration-150 hover:bg-canvas hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={disabled || index === files.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label={`Move ${file.name} down`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors duration-150 hover:bg-canvas hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </span>
            )}

            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(index)}
              aria-label={`Remove ${file.name}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-faint transition-colors duration-150 hover:bg-danger-soft hover:text-danger disabled:opacity-30"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </li>
        );
      })}

      {/* Only for multi-file tools. On a single-file tool the card above
          already says everything, and a summary of one file is noise. */}
      {files.length > 1 && (
        <li className="flex items-center justify-between px-1 pt-1 text-[12px] text-faint">
          <span>
            {files.length} files · {formatBytes(totalBytes)}
          </span>
          {totalPages > 0 && (
            <span>
              {totalPages} {totalPages === 1 ? "page" : "pages"} total
            </span>
          )}
        </li>
      )}
    </ul>
  );
}
