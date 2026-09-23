import Link from "next/link";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  toolsInCategory,
} from "@/lib/tools";


/**
 * Server-rendered footer. Links every tool from every page, which gives the
 * site a fully connected internal linking graph for crawlers.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-[14px] font-semibold">
            <span
              aria-hidden="true"
              className="grid h-5 w-5 place-items-center rounded bg-ink text-[10px] font-bold text-white"
            >
              P
            </span>
            PDF Utility
          </p>
          <p className="mt-2 max-w-[22ch] text-[13px] leading-relaxed text-faint">
            Fast, private PDF tools. No signup, no watermarks.
          </p>
        </div>

        {CATEGORY_ORDER.map((category) => (
          <nav key={category} aria-label={CATEGORY_LABELS[category]}>
            <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">
              {CATEGORY_LABELS[category]}
            </p>
            <ul className="mt-3 space-y-2">
              {toolsInCategory(category).map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/${tool.slug}`}
                    className="text-[13.5px] text-muted transition-colors duration-150 hover:text-ink"
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-10">
        <p className="border-t border-line pt-6 text-[12.5px] text-faint">
          Files are processed on your device wherever possible and deleted
          automatically when they are not.
        </p>
      </div>
    </footer>
  );
}
