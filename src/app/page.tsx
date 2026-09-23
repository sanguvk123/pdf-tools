import Link from "next/link";
import { ToolCard } from "@/components/ToolCard";
import { FEATURED_TOOLS } from "@/lib/tools";

/**
 * Homepage. Fully static and free of processing code — the heavy PDF
 * libraries only load on the tool route that needs them.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <section className="pt-16 pb-10 text-center sm:pt-24">
        <h1 className="text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[46px]">
          PDF tools that just work.
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted sm:text-[16.5px]">
          Merge, compress, convert, split and edit your PDFs in seconds.
        </p>
      </section>

      <section aria-labelledby="popular-tools" className="pb-6">
        <h2 id="popular-tools" className="sr-only">
          Popular tools
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_TOOLS.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        <p className="mt-6 text-center text-[13.5px]">
          <Link
            href="/pdf-tools"
            className="text-muted transition-colors duration-150 hover:text-ink"
          >
            See all tools →
          </Link>
        </p>
      </section>

      <section className="mx-auto max-w-2xl py-14 text-center">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              title: "Instant",
              body: "Most tools run in your browser, so there is nothing to upload and nothing to wait for.",
            },
            {
              title: "Private",
              body: "Your files stay on your device. When a tool does need a server, files are deleted right after processing.",
            },
            {
              title: "Free",
              body: "No account, no watermarks, no limits hidden behind a paywall.",
            },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-[14px] font-medium">{item.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
