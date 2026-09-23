import type { Metadata } from "next";
import { Faq } from "@/components/Faq";
import { IntentCompressTool } from "@/components/IntentCompressTool";
import { RelatedTools } from "@/components/RelatedTools";
import { COMPRESS_INTENTS, type CompressIntent } from "@/lib/compressIntents";
import { COMPRESS_TARGETS } from "@/lib/compressTargets";

/**
 * Shared implementation for the intent-based compression landing pages.
 *
 * Mirrors CompressTargetPage, but the pre-selected strength comes from a
 * quality preference rather than a byte goal.
 */

export function buildIntentMetadata(intent: CompressIntent): Metadata {
  return {
    title: intent.metaTitle,
    description: intent.metaDescription,
    alternates: { canonical: `/${intent.slug}` },
    openGraph: {
      title: intent.metaTitle,
      description: intent.metaDescription,
      url: `/${intent.slug}`,
    },
  };
}

export function CompressIntentPage({ intent }: { intent: CompressIntent }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: intent.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const others = COMPRESS_INTENTS.filter((other) => other.slug !== intent.slug);

  return (
    <>
      <script
        type="application/ld+json"
        // Generated from our own registry, so the content is trusted.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-xl px-5 pt-10 text-center sm:pt-16">
        <h1 className="text-[27px] leading-tight font-semibold tracking-[-0.03em] sm:text-[32px]">
          {intent.heading}
        </h1>
        <p className="mx-auto mt-2 max-w-[42ch] text-[14.5px] text-muted">
          {intent.subtitle}
        </p>
      </div>

      {/* This page owns the <h1> above, so the tool omits its own heading
          rather than rendering a second one. */}
      <IntentCompressTool level={intent.level} showHeading={false} />

      <div className="mx-auto max-w-xl px-5 pb-10">
        <section className="mt-14">
          <h2 className="text-[11px] font-semibold tracking-wide text-faint uppercase">
            How this works
          </h2>
          <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-muted">
            <p>{intent.rationale}</p>
            <p>
              Compression runs entirely inside your browser, so your document is
              never uploaded and there is no waiting on a connection. You will
              see the exact before and after size, including when the saving
              turns out to be small.
            </p>
          </div>
        </section>

        <Faq items={intent.faq} />

        <RelatedTools slug="compress-pdf" />

        <nav aria-label="Other compression options" className="mt-10">
          <h2 className="text-[11px] font-semibold tracking-wide text-faint uppercase">
            Need a specific size?
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {COMPRESS_TARGETS.map((target) => (
              <li key={target.slug}>
                <a
                  href={`/compress-pdf-to-${target.slug}`}
                  className="inline-block rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
                >
                  Compress to {target.label}
                </a>
              </li>
            ))}
            {others.map((other) => (
              <li key={other.slug}>
                <a
                  href={`/${other.slug}`}
                  className="inline-block rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
                >
                  {other.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
