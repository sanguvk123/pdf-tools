"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { track } from "@/lib/analytics";
import { setHandoff } from "@/lib/handoff";
import { CATEGORY_STYLES, relatedTools, type Tool } from "@/lib/tools";
import { matchesAccept } from "@/lib/validate";

/**
 * Offers the finished file to the next tool.
 *
 * Only tools that can actually accept this file are listed: sending a PNG to a
 * PDF-only tool would hand the user a validation error as the reward for
 * following our own suggestion. Single-output only, because "continue" is
 * ambiguous when there are twelve files.
 */
export function ContinueWith({
  tool,
  file,
}: {
  tool: Tool;
  /** The produced file, when the tool made exactly one. */
  file: File;
}) {
  const router = useRouter();

  const candidates = relatedTools(tool.slug, 8)
    .filter((next) => matchesAccept(file, next.accept))
    .slice(0, 3);

  if (candidates.length === 0) return null;

  return (
    <section aria-labelledby="continue-with" className="animate-rise mt-6">
      <h2 id="continue-with" className="text-center text-[13px] text-muted">
        Keep going with this file
      </h2>

      <div className="mt-3 grid gap-2">
        {candidates.map((next) => (
          <button
            key={next.slug}
            type="button"
            onClick={() => {
              setHandoff(file, tool.slug);
              track("secondary_tool_clicked", {
                tool: tool.slug,
                target: next.slug,
              });
              router.push(`/${next.slug}`);
            }}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left transition-colors duration-150 hover:border-line-strong"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${CATEGORY_STYLES[next.category].tile}`}
            >
              <Icon name={next.icon} className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-medium text-ink">
                {next.name}
              </span>
              <span className="block truncate text-[12px] text-muted">
                {next.tagline}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-2.5 text-center text-[11.5px] text-faint">
        Your file stays on your device — nothing is re-uploaded.
      </p>
    </section>
  );
}
