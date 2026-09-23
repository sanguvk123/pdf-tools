"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { track } from "@/lib/analytics";
import { relatedTools } from "@/lib/tools";

interface RelatedToolsProps {
  slug: string;
  /** "More PDF tools" in the footer, "Done with this PDF?" after a result. */
  title?: string;
  compact?: boolean;
}

/**
 * Cross-links into the rest of the toolset. Shown after a successful result to
 * build the ecosystem, and at the bottom of every tool page for crawlers.
 */
export function RelatedTools({
  slug,
  title = "More PDF tools",
  compact = false,
}: RelatedToolsProps) {
  const tools = relatedTools(slug, compact ? 4 : 6);

  return (
    <section aria-labelledby={`related-${slug}`} className={compact ? "" : "mt-14"}>
      <h2
        id={`related-${slug}`}
        className={
          compact
            ? "text-center text-[13px] text-muted"
            : "text-[11px] font-semibold tracking-wide text-faint uppercase"
        }
      >
        {title}
      </h2>

      <div
        className={[
          "mt-3 grid gap-2",
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
        ].join(" ")}
      >
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/${tool.slug}`}
            prefetch={false}
            onClick={() =>
              track("secondary_tool_clicked", { tool: slug, target: tool.slug })
            }
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 transition-colors duration-150 hover:border-line-strong"
          >
            <span className="text-muted">
              <Icon name={tool.icon} className="h-4 w-4" />
            </span>
            <span className="truncate text-[13px] font-medium text-ink">
              {tool.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
