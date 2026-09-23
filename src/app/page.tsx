import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { Icon } from "@/components/Icon";
import { ToolCard } from "@/components/ToolCard";
import { absoluteUrl } from "@/lib/site";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_STYLES,
  FEATURED_TOOLS,
  TOOLS,
  toolsInCategory,
  type FaqItem,
} from "@/lib/tools";

/**
 * Counted from the registry rather than written as prose, so the privacy
 * claim on the homepage cannot drift out of date when a tool moves between
 * the browser and the server.
 */
const CLIENT_TOOL_COUNT = TOOLS.filter(
  (tool) => tool.engine === "client",
).length;

const SERVER_TOOL_COUNT = TOOLS.length - CLIENT_TOOL_COUNT;

/**
 * The questions people ask before trusting a file to a site they found on
 * Google — cost, privacy, signup, limits. Answered plainly and, where the
 * answer is unflattering, honestly: three tools do upload, and saying so here
 * is better than having someone discover it mid-task.
 */
const HOME_FAQ: FaqItem[] = [
  {
    q: "Is it really free?",
    a: "Yes. Every tool is free with no account, no watermark on the output, and no daily limit. There is no paid tier holding back a feature.",
  },
  {
    q: "Do my files get uploaded?",
    a: `${CLIENT_TOOL_COUNT} of the ${TOOLS.length} tools run entirely in your browser, so the file never leaves your device — you can disconnect from the internet after the page loads and they still work. The ${SERVER_TOOL_COUNT} conversions to Word, Excel and text need a server to read the document, so those upload over an encrypted connection and delete the file immediately afterwards. Each tool says which kind it is above the upload box.`,
  },
  {
    q: "Do I need to create an account?",
    a: "No. There is no signup, no email prompt, and no login wall at the download step.",
  },
  {
    q: "How large a file can I use?",
    a: "Up to 100 MB per file. Browser-based tools are limited by your device's memory rather than a server quota, so very large documents are slower but still work.",
  },
  {
    q: "Will the quality drop?",
    a: "Merging, splitting, rotating and reordering rewrite the file structure without touching the page contents, so they are lossless. Compression is the one tool that trades quality for size, and you choose how much.",
  },
  {
    q: "Does it work on a phone?",
    a: "Yes. The tools work in mobile browsers on both iOS and Android, including picking a file from your cloud storage or camera roll.",
  },
];

/**
 * Real starting points rather than keyword bait: each is a task someone
 * actually arrives with, pointing at the page that already solves it.
 */
const COMMON_TASKS: { label: string; href: string }[] = [
  { label: "Compress a PDF to 100 KB", href: "/compress-pdf-to-100kb" },
  { label: "Compress a PDF to 1 MB", href: "/compress-pdf-to-1mb" },
  { label: "Shrink a PDF for email", href: "/compress-large-pdf" },
  { label: "Compress without losing quality", href: "/compress-pdf-without-losing-quality" },
  { label: "Combine two PDFs into one", href: "/merge-pdf" },
  { label: "Split a PDF into single pages", href: "/split-pdf" },
  { label: "Delete pages from a PDF", href: "/delete-pages-pdf" },
  { label: "Rearrange the page order", href: "/reorder-pdf-pages" },
  { label: "Turn a PDF into an editable Word file", href: "/pdf-to-word" },
  { label: "Save PDF pages as images", href: "/pdf-to-jpg" },
  { label: "Make a PDF from phone photos", href: "/jpg-to-pdf" },
  { label: "Pull tables into a spreadsheet", href: "/pdf-to-excel" },
];

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
  /**
   * Only valid because the same questions and answers are rendered visibly
   * below. Marking up content the user cannot see is what Google penalises as
   * structured-data spam, so this is generated from HOME_FAQ rather than
   * written out separately — the two cannot drift apart.
   */
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PDF Utility",
    url: absoluteUrl("/"),
  };

  return (
    <div className="mx-auto max-w-6xl px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
          {[`${CLIENT_TOOL_COUNT} of ${TOOLS.length} tools run in your browser`, "No signup", "No watermarks"].map(
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
              body: `${CLIENT_TOOL_COUNT} of the ${TOOLS.length} tools never upload anything. The ${TOOLS.length - CLIENT_TOOL_COUNT} conversions that need a server say so on the page, and delete your file straight after.`,
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

      {/* Every tool, grouped by what it does. A crawler reaching the homepage
          finds a link to all 15 without following the nav dropdowns, and a
          visitor who does not know the tool's name can scan by intent. */}
      <section aria-labelledby="all-tools" className="border-t border-line pt-9">
        <h2 id="all-tools" className="text-[19px] font-semibold tracking-tight">
          All PDF tools
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">
          {TOOLS.length} tools, free and without a signup.
        </p>

        <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_ORDER.map((category) => (
            <div key={category}>
              <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-faint uppercase">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[category].dot}`}
                />
                {CATEGORY_LABELS[category]}
              </h3>
              <ul className="mt-2 space-y-0.5">
                {toolsInCategory(category).map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/${tool.slug}`}
                      className="flex items-center gap-2 rounded-md py-1.5 text-[13.5px] text-muted transition-colors duration-150 hover:text-ink"
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${CATEGORY_STYLES[category].tile}`}
                      >
                        <Icon name={tool.icon} className="h-3 w-3" />
                      </span>
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="how-it-works"
        className="mt-11 border-t border-line pt-9"
      >
        <h2
          id="how-it-works"
          className="text-[19px] font-semibold tracking-tight"
        >
          How it works
        </h2>

        <ol className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Pick a tool",
              body: "Search for the task in your own words, or choose from the list above. Every tool has its own page.",
            },
            {
              step: "2",
              title: "Add your file",
              body: "Drag it in, tap to browse, or paste from the clipboard. Most tools start working the moment the file lands.",
            },
            {
              step: "3",
              title: "Download",
              body: "Save the result and carry on — or send it straight into another tool without uploading it again.",
            },
          ].map((item) => (
            <li
              key={item.step}
              className="rounded-[14px] border border-line bg-surface p-4"
            >
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white"
              >
                {item.step}
              </span>
              <p className="mt-2.5 text-[14px] font-medium">{item.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="common-tasks"
        className="mt-11 border-t border-line pt-9"
      >
        <h2
          id="common-tasks"
          className="text-[19px] font-semibold tracking-tight"
        >
          Common PDF tasks
        </h2>
        <p className="mt-1 text-[13.5px] text-muted">
          Jump straight to the page that handles it.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {COMMON_TASKS.map((task) => (
            <li key={task.href}>
              <Link
                href={task.href}
                className="inline-flex rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] text-muted transition-colors duration-150 hover:border-accent/40 hover:text-ink"
              >
                {task.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="pb-4">
        <Faq items={HOME_FAQ} />
      </div>
    </div>
  );
}
