import type { Metadata } from "next";
import { ToolCard } from "@/components/ToolCard";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_STYLES,
  toolsInCategory,
} from "@/lib/tools";

export const metadata: Metadata = {
  title: "All PDF tools",
  // Lists only tools that exist: promising "protect" in a search snippet and
  // not offering it is the kind of mismatch that produces an instant bounce.
  description:
    "Every PDF tool in one place. Compress, convert, merge, split, rotate and reorder files in seconds — free, no signup, no watermarks.",
  alternates: { canonical: "/pdf-tools" },
};


export default function AllToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="pt-9 pb-6 text-center sm:pt-12">
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.03em] sm:text-[38px]">
          All tools
        </h1>
        <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-muted">
          Every operation is free, needs no account, and works the same way.
        </p>
      </header>

      {CATEGORY_ORDER.map((category) => {
        const tools = toolsInCategory(category);
        const style = CATEGORY_STYLES[category];

        return (
          <section key={category} className="pb-7" aria-labelledby={category}>
            {/* A coloured marker ties the heading to the tiles below it, so
                the four groups are distinguishable while scrolling rather
                than relying on the reader tracking small grey labels. */}
            <h2
              id={category}
              className="mb-2.5 flex items-center gap-2 text-[12px] font-semibold tracking-wide uppercase"
            >
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${style.dot}`}
              />
              <span className={style.text}>{CATEGORY_LABELS[category]}</span>
              <span className="text-[11px] font-normal normal-case text-faint">
                {tools.length} tools
              </span>
            </h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
