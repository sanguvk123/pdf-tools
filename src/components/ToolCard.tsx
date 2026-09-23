import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Tool } from "@/lib/tools";

/**
 * Grid card: icon, name, one-line explanation. No statistics, no badges.
 * Prefetches the tool route so navigation feels instant.
 */
export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/${tool.slug}`}
      prefetch
      className="group flex flex-col rounded-[14px] border border-line bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">
        <Icon name={tool.icon} className="h-[18px] w-[18px]" />
      </span>

      <span className="mt-3 text-[14.5px] font-medium tracking-tight text-ink">
        {tool.name}
      </span>
      <span className="mt-0.5 text-[13px] text-muted">{tool.tagline}</span>

      <span
        aria-hidden="true"
        className="mt-3 text-[14px] text-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent"
      >
        →
      </span>
    </Link>
  );
}
