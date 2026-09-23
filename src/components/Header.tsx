"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABELS, toolsInCategory, type ToolCategory } from "@/lib/tools";

const CATEGORIES: ToolCategory[] = ["pdf", "image", "convert"];

/**
 * Minimal persistent navigation. Rendered in the root layout so it stays
 * mounted across tool routes and never re-downloads.
 */
export function Header() {
  const [openMenu, setOpenMenu] = useState<ToolCategory | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Dismiss the desktop dropdown on outside click or Escape.
  useEffect(() => {
    if (!openMenu) return;

    function onPointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
        >
          <span
            aria-hidden="true"
            className="grid h-6 w-6 place-items-center rounded-md bg-ink text-[11px] font-bold text-white"
          >
            P
          </span>
          PDF Utility
        </Link>

        <nav
          ref={navRef}
          aria-label="Tools"
          className="relative hidden items-center gap-1 md:flex"
        >
          {CATEGORIES.map((category) => (
            <div key={category}>
              <button
                type="button"
                aria-expanded={openMenu === category}
                aria-haspopup="true"
                onClick={() =>
                  setOpenMenu((current) =>
                    current === category ? null : category,
                  )
                }
                className="rounded-md px-2.5 py-1.5 text-[13.5px] text-muted transition-colors duration-150 hover:bg-line/60 hover:text-ink"
              >
                {CATEGORY_LABELS[category]}
              </button>

              {openMenu === category && (
                <div className="animate-rise absolute top-full left-0 mt-1 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-black/5">
                  {toolsInCategory(category).map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/${tool.slug}`}
                      prefetch
                      onClick={() => setOpenMenu(null)}
                      className="block rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-canvas"
                    >
                      <span className="block text-[13.5px] font-medium text-ink">
                        {tool.name}
                      </span>
                      <span className="block text-[12px] text-faint">
                        {tool.tagline}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/compress-pdf"
            prefetch
            className="hidden rounded-lg bg-ink px-3.5 py-1.5 text-[13.5px] font-medium text-white transition-opacity duration-150 hover:opacity-85 sm:block"
          >
            Get started
          </Link>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line md:hidden"
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
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="animate-rise border-t border-line bg-surface px-5 py-3 md:hidden"
        >
          {CATEGORIES.map((category) => (
            <div key={category} className="py-2">
              <p className="px-1 pb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
                {CATEGORY_LABELS[category]}
              </p>
              {toolsInCategory(category).map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-1 py-2 text-[14px] text-ink"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
