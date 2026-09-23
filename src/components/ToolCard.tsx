import Link from "next/link";
import { Icon } from "@/components/Icon";
import { CATEGORY_STYLES, type Tool } from "@/lib/tools";

/**
 * Grid card: coloured icon, name, one-line explanation.
 *
 * Horizontal layout rather than stacked: the icon sits beside the text
 * instead of above it, which removes a row of vertical space per card and
 * lets fifteen tools fit on screen without scrolling past empty margins.
 * The icon is tinted by category, so the grid reads as four related groups.
 */
export function ToolCard({ tool }: { tool: Tool }) {
  const style = CATEGORY_STYLES[tool.category];

  return (
    <Link
      href={`/${tool.slug}`}
      prefetch
      className="group flex items-start gap-3 rounded-[14px] border border-line bg-surface p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.25)]"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] transition-transform duration-150 group-hover:scale-105 ${style.tile}`}
      >
        <Icon name={tool.icon} className="h-5 w-5" />
      </span>

      <span className="min-w-0">
        <span className="block text-[14.5px] font-medium tracking-tight text-ink">
          {tool.name}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
          {tool.tagline}
        </span>
      </span>
    </Link>
  );
}
