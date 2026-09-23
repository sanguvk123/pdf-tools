import type { Metadata } from "next";
import Link from "next/link";
import { ToolCard } from "@/components/ToolCard";
import { FEATURED_TOOLS } from "@/lib/tools";

/**
 * Title and description are inherited from the root layout; only the
 * canonical is declared here. Without it the homepage is the one page on the
 * site with no canonical, which leaves "/" and any tracking-parameter
 * variant of it looking like separate pages to a crawler.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Homepage. Fully static and free of processing code — the heavy PDF
 * libraries only load on the tool route that needs them.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Roughly half the previous vertical padding. The hero was pushing the
          tools — the reason anyone visits — below the fold on a laptop. */}
      <section className="pt-10 pb-7 text-center sm:pt-14">
        <h1 className="text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[44px]">
          PDF tools that{" "}
          <span className="bg-gradient-to-r from-cat-compress via-cat-convert to-cat-organize bg-clip-text text-transparent">
            just work
          </span>
          .
        </h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-[15px] leading-relaxed text-muted sm:text-[16px]">
          Merge, compress, convert, split and edit your PDFs in seconds.
        </p>

        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[12.5px] text-muted">
          {["Runs in your browser", "No signup", "No watermarks"].map(
            (claim) => (
              <li key={claim} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-success"
                />
                {claim}
              </li>
            ),
          )}
        </ul>
      </section>

      <section aria-labelledby="popular-tools">
        <h2 id="popular-tools" className="sr-only">
          Popular tools
        </h2>
        {/* Four columns on large screens: the cards are now horizontal and
            short, so three columns left a wide empty gutter. */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_TOOLS.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        <p className="mt-5 text-center text-[13.5px]">
          <Link
            href="/pdf-tools"
            className="font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
          >
            See all 15 tools →
          </Link>
        </p>
      </section>

      <section className="py-10">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            {
              title: "Instant",
              body: "Most tools run in your browser, so there is nothing to upload and nothing to wait for.",
              tile: "bg-cat-compress-soft text-cat-compress",
              icon: "M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z",
            },
            {
              title: "Private",
              body: "Your files stay on your device. When a tool does need a server, files are deleted right after processing.",
              tile: "bg-cat-organize-soft text-cat-organize",
              icon: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z",
            },
            {
              title: "Free",
              body: "No account, no watermarks, no limits hidden behind a paywall.",
              tile: "bg-cat-edit-soft text-cat-edit",
              icon: "M12 21s-7.5-4.6-9.3-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.3 12c-1.8 4.4-9.3 9-9.3 9Z",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[14px] border border-line bg-surface p-4"
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-[10px] ${item.tile}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-[18px] w-[18px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
              </span>
              <p className="mt-2.5 text-[14px] font-medium">{item.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
