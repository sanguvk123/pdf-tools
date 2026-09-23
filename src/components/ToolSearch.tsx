"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { track } from "@/lib/analytics";
import { CATEGORY_STYLES } from "@/lib/tools";
import { searchTools } from "@/lib/toolSearch";

/**
 * Find-a-tool box for the header.
 *
 * Implemented as an ARIA combobox rather than a styled input with a div of
 * links under it. The pattern matters here: a keyboard or screen-reader user
 * needs to know that typing changed the results and that arrow keys move
 * through them, and none of that is conveyed by appearance alone.
 *
 * Results come from searchTools, which is synchronous and runs over a
 * fifteen-item registry, so there is no debounce and no loading state. Adding
 * either would make the feature feel slower than it is.
 */
export function ToolSearch({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const results = query.trim() ? searchTools(query) : [];
  const isExpanded = isOpen && query.trim().length > 0;

  // The highlight is clamped during render rather than reset from an effect.
  // Storing it and correcting it afterwards would let one frame paint with a
  // highlight pointing past the end of a newly shortened result list, and
  // Enter in that frame would open the wrong tool.
  const activeIndex = results.length
    ? Math.min(highlight, results.length - 1)
    : 0;

  // Record searches that found nothing, after the user stops typing. These are
  // the only direct evidence of which phrasings the keyword lists still miss;
  // without them the gap is invisible, because a user who finds nothing leaves
  // rather than complaining. Delayed so "m", "me", "mer" are not all logged
  // as failures on the way to "merge".
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || results.length > 0) return;

    const timer = setTimeout(() => {
      track("tool_search_no_results", { query: trimmed });
    }, 900);

    return () => clearTimeout(timer);
  }, [query, results.length]);

  useEffect(() => {
    if (!isExpanded) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isExpanded]);

  function close() {
    setIsOpen(false);
    setQuery("");
  }

  function goTo(slug: string, position: number) {
    track("tool_search_selected", { query: query.trim(), slug, position });
    close();
    onNavigate?.();
    router.push(`/${slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      // First Escape clears, second gives focus back to the page. Closing
      // outright on the first press loses a query the user may be editing.
      if (query) {
        event.preventDefault();
        setQuery("");
        return;
      }
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isExpanded || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight(
        (index) => (index - 1 + results.length) % results.length,
      );
      return;
    }

    if (event.key === "Enter") {
      const tool = results[activeIndex];
      if (tool) {
        event.preventDefault();
        goTo(tool.slug, activeIndex);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isExpanded}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            isExpanded && results.length
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          aria-label="Search tools"
          placeholder="Search tools — try “make pdf smaller”"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          className="h-9 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-[13.5px] text-ink transition-colors duration-150 outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {isExpanded && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Tool search results"
          className="animate-rise absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-black/5"
        >
          {results.length === 0 ? (
            /**
             * Deliberately not a list of "popular tools" instead. Filling an
             * empty result with unrelated suggestions hides the fact that the
             * search understood nothing, and teaches people to distrust the
             * results that are real.
             */
            <p className="px-3 py-3 text-[13px] text-muted">
              No tool matches “{query.trim()}”.{" "}
              <Link
                href="/pdf-tools"
                onClick={() => {
                  close();
                  onNavigate?.();
                }}
                className="font-medium text-accent underline underline-offset-2"
              >
                Browse all tools
              </Link>
            </p>
          ) : (
            results.map((tool, index) => (
              <button
                key={tool.slug}
                type="button"
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                // Pointer focus follows the mouse so hover and keyboard
                // highlighting never disagree about what Enter will open.
                onMouseEnter={() => setHighlight(index)}
                onClick={() => goTo(tool.slug, index)}
                className={[
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-100",
                  index === activeIndex ? "bg-line/60" : "",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${CATEGORY_STYLES[tool.category].tile}`}
                >
                  <Icon name={tool.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-ink">
                    {tool.name}
                  </span>
                  <span className="block truncate text-[12px] text-muted">
                    {tool.tagline}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
