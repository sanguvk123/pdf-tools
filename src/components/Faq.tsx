import type { FaqItem } from "@/lib/tools";

/**
 * Server-rendered FAQ using native <details>, so the answers are in the HTML
 * for crawlers and work with zero JavaScript.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="faq" className="mt-14">
      <h2 id="faq" className="text-[11px] font-semibold tracking-wide text-faint uppercase">
        Frequently asked questions
      </h2>

      <div className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {items.map((item) => (
          <details key={item.q} className="group px-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[13.5px] font-medium text-ink">
              {item.q}
              <span
                aria-hidden="true"
                className="shrink-0 text-faint transition-transform duration-150 group-open:rotate-45"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </summary>
            <p className="pb-4 text-[13px] leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
