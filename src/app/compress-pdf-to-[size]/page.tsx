import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TargetCompressTool } from "./TargetCompressTool";
import { Faq } from "@/components/Faq";
import { RelatedTools } from "@/components/RelatedTools";
import { COMPRESS_TARGETS, getCompressTarget } from "@/lib/compressTargets";

/** Pre-renders one static page per size target. */
export function generateStaticParams() {
  return COMPRESS_TARGETS.map((target) => ({ size: target.slug }));
}

export const dynamicParams = false;

interface SizeParams {
  params: Promise<{ size: string }>;
}

export async function generateMetadata({
  params,
}: SizeParams): Promise<Metadata> {
  const { size } = await params;
  const target = getCompressTarget(size);
  if (!target) return {};

  const title = `Compress PDF to ${target.label} — free online compressor`;
  const description = `Reduce your PDF to ${target.label} or less so it fits email and upload limits. Free, no signup, and the file never leaves your device.`;

  return {
    title,
    description,
    alternates: { canonical: `/compress-pdf-to-${target.slug}` },
    openGraph: { title, description, url: `/compress-pdf-to-${target.slug}` },
  };
}

export default async function CompressToSizePage({ params }: SizeParams) {
  const { size } = await params;
  const target = getCompressTarget(size);
  if (!target) notFound();

  const faq = [
    {
      q: `Can every PDF be compressed to ${target.label}?`,
      a: `Not always. A short text document will drop well below ${target.label}, but a long scanned file may not get there without removing pages. We tell you the exact size you ended up with, so you always know where you stand.`,
    },
    {
      q: "Will the text still be readable?",
      a: "Yes. Text stays sharp and selectable. Compression works on document structure and image data, not on the text itself.",
    },
    {
      q: "Is my file uploaded to a server?",
      a: "No. Compression runs inside your browser, so the document never leaves your device.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-xl px-5 pt-10 text-center sm:pt-16">
        <h1 className="text-[27px] leading-tight font-semibold tracking-[-0.03em] sm:text-[32px]">
          Compress PDF to {target.label}
        </h1>
        <p className="mx-auto mt-2 max-w-[42ch] text-[14.5px] text-muted">
          Get your PDF under {target.label} so it fits the limit you are up
          against.
        </p>
      </div>

      {/* The tool renders its own heading block, which we have replaced above,
          so it starts directly at the upload zone. */}
      <div className="[&_h1]:sr-only [&_h1+p]:sr-only">
        <TargetCompressTool target={target} />
      </div>

      <div className="mx-auto max-w-xl px-5 pb-10">
        <section className="mt-14">
          <h2 className="text-[11px] font-semibold tracking-wide text-faint uppercase">
            Getting under {target.label}
          </h2>
          <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-muted">
            <p>
              Attachment limits are the usual reason for a specific target.
              Gmail stops at 25 MB, many government and university portals at 2
              MB, and plenty of application forms at {target.label} or less.
            </p>
            <p>
              This page pre-selects a compression strength suited to{" "}
              {target.label} so there is nothing to configure. Drop your file in
              and we will tell you the exact size you ended up with.
            </p>
            <p>
              If a scanned document still will not fit, the fastest remaining
              option is to reduce the page count — extract only the pages you
              actually need to send.
            </p>
          </div>
        </section>

        <Faq items={faq} />

        <RelatedTools slug="compress-pdf" />

        <nav aria-label="Other size targets" className="mt-10">
          <h2 className="text-[11px] font-semibold tracking-wide text-faint uppercase">
            Other sizes
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {COMPRESS_TARGETS.filter((other) => other.slug !== target.slug).map(
              (other) => (
                <li key={other.slug}>
                  <a
                    href={`/compress-pdf-to-${other.slug}`}
                    className="inline-block rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
                  >
                    Compress to {other.label}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
