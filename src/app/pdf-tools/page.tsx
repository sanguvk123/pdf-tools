import type { Metadata } from "next";
import { ToolCard } from "@/components/ToolCard";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  toolsInCategory,
} from "@/lib/tools";

export const metadata: Metadata = {
  title: "All PDF tools",
  description:
    "Every PDF, image and conversion tool in one place. Merge, compress, split, rotate, protect and convert files in seconds — free and without signup.",
  alternates: { canonical: "/pdf-tools" },
};


export default function AllToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <header className="pt-14 pb-8 text-center sm:pt-20">
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.03em] sm:text-[38px]">
          All tools
        </h1>
        <p className="mx-auto mt-3 max-w-[44ch] text-[15px] text-muted">
          Every operation is free, needs no account, and works the same way.
        </p>
      </header>

      {CATEGORY_ORDER.map((category) => (
        <section key={category} className="pb-10" aria-labelledby={category}>
          <h2
            id={category}
            className="mb-3 text-[11px] font-semibold tracking-wide text-faint uppercase"
          >
            {CATEGORY_LABELS[category]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {toolsInCategory(category).map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
