"use client";

import { useState } from "react";
import { formatPageRanges, parsePageRanges, pluralize } from "@/lib/format";

interface PagePickerProps {
  pageCount: number;
  selected: number[];
  onChange: (pages: number[]) => void;
  /** "Select the pages you want" / "Select the pages to remove". */
  legend: string;
  disabled?: boolean;
}

/**
 * Visual page selector with a text field for ranges.
 *
 * Page numbers rather than rendered thumbnails: the grid is instantly
 * available with no rendering pass, which keeps the tool interactive the
 * moment the file is read.
 */
export function PagePicker({
  pageCount,
  selected,
  onChange,
  legend,
  disabled = false,
}: PagePickerProps) {
  // Holds the raw text only while the field has focus, so we don't fight the
  // user's typing by reformatting mid-keystroke. Outside of editing the value
  // is derived from the selection, which keeps the two views in step without
  // an effect.
  const [draftRange, setDraftRange] = useState<string | null>(null);
  const rangeText = draftRange ?? formatPageRanges(selected);

  const selectedSet = new Set(selected);

  function toggle(page: number) {
    const next = new Set(selectedSet);
    if (next.has(page)) {
      next.delete(page);
    } else {
      next.add(page);
    }
    onChange([...next].sort((a, b) => a - b));
  }

  const allSelected = selected.length === pageCount && pageCount > 0;

  return (
    <fieldset disabled={disabled}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <legend className="text-[13px] font-medium text-ink">{legend}</legend>
        <button
          type="button"
          onClick={() =>
            onChange(
              allSelected
                ? []
                : Array.from({ length: pageCount }, (_, index) => index + 1),
            )
          }
          className="text-[12.5px] text-muted transition-colors duration-150 hover:text-ink"
        >
          {allSelected ? "Clear" : "Select all"}
        </button>
      </div>

      <div className="rounded-xl border border-line bg-surface p-3">
        <div
          role="group"
          aria-label={legend}
          className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto"
        >
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => {
            const isSelected = selectedSet.has(page);

            return (
              <button
                key={page}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Page ${page}`}
                onClick={() => toggle(page)}
                className={[
                  "h-9 min-w-9 rounded-lg border px-2 text-[12.5px] tabular-nums transition-colors duration-150",
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-canvas text-muted hover:border-line-strong hover:text-ink",
                ].join(" ")}
              >
                {page}
              </button>
            );
          })}
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <label
            htmlFor="page-ranges"
            className="block text-[12px] text-faint"
          >
            Or type page ranges
          </label>
          <input
            id="page-ranges"
            type="text"
            value={rangeText}
            placeholder="e.g. 1-3, 8, 11-14"
            onFocus={() => setDraftRange(formatPageRanges(selected))}
            onBlur={() => setDraftRange(null)}
            onChange={(event) => {
              setDraftRange(event.target.value);
              onChange(parsePageRanges(event.target.value, pageCount));
            }}
            className="mt-1.5 h-9 w-full rounded-lg border border-line bg-canvas px-2.5 text-[13px] outline-none transition-colors duration-150 focus:border-accent"
          />
        </div>
      </div>

      <p aria-live="polite" className="mt-2 text-[12.5px] text-muted">
        {selected.length === 0
          ? `No pages selected · ${pluralize(pageCount, "page")} in total`
          : `${pluralize(selected.length, "page")} selected`}
      </p>
    </fieldset>
  );
}
