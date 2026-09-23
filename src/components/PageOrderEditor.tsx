"use client";

import { useState } from "react";

/**
 * Drag-to-reorder grid of page tiles.
 *
 * Dragging is the obvious gesture but a poor sole affordance: it is awkward on
 * touch, impossible with a keyboard, and invisible to screen readers. Each
 * tile therefore also carries move-back and move-forward buttons, and the live
 * region announces the result of every move.
 */
export function PageOrderEditor({
  order,
  onChange,
}: {
  /** 1-based source page numbers in their current display order. */
  order: number[];
  onChange: (next: number[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;

    const next = [...order];
    const [page] = next.splice(from, 1);
    next.splice(to, 0, page);

    onChange(next);
    setAnnouncement(`Page ${page} moved to position ${to + 1} of ${next.length}.`);
  }

  return (
    <fieldset>
      <legend className="text-[11px] font-semibold tracking-wide text-faint uppercase">
        Drag pages into the order you want
      </legend>

      <ul className="mt-3 flex flex-wrap gap-2">
        {order.map((page, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== index;

          return (
            <li
              key={page}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragOver={(event) => {
                // Without this the drop is rejected by the browser.
                event.preventDefault();
                setOverIndex(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={[
                "flex w-[86px] flex-col items-center gap-1 rounded-xl border bg-surface p-2 transition-colors duration-150",
                isDragging ? "opacity-40" : "",
                isOver ? "border-accent" : "border-line",
              ].join(" ")}
            >
              <div className="flex h-[58px] w-full cursor-grab items-center justify-center rounded-lg bg-canvas text-[15px] font-medium text-ink active:cursor-grabbing">
                {page}
              </div>

              <div className="flex w-full items-center justify-between">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Move page ${page} earlier`}
                  className="rounded px-1.5 py-0.5 text-[13px] text-muted transition-colors duration-150 hover:text-ink disabled:opacity-30 disabled:hover:text-muted"
                >
                  ←
                </button>
                <span className="text-[10.5px] text-faint" aria-hidden="true">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === order.length - 1}
                  aria-label={`Move page ${page} later`}
                  className="rounded px-1.5 py-0.5 text-[13px] text-muted transition-colors duration-150 hover:text-ink disabled:opacity-30 disabled:hover:text-muted"
                >
                  →
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  );
}
