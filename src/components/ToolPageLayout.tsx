import type { ReactNode } from "react";
import { Faq } from "@/components/Faq";
import { RelatedTools } from "@/components/RelatedTools";
import type { Tool } from "@/lib/tools";

interface ToolPageLayoutProps {
  tool: Tool;
  /** The interactive client component for this tool. */
  children: ReactNode;
  /** Explanatory copy shown below the tool, for readers and crawlers. */
  about: ReactNode;
}

/**
 * Server component wrapper for every tool page. Everything here is static
 * HTML: the interactive island is the only client JavaScript on the route.
 */
export function ToolPageLayout({ tool, children, about }: ToolPageLayoutProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.heading,
    description: tool.metaDescription,
    url: `https://pdfutility.app/${tool.slug}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Generated from our own registry, so the content is trusted.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([appSchema, faqSchema]),
        }}
      />

      {children}

      <div className="mx-auto max-w-xl px-5 pb-10">
        <section className="mt-14">
          <h2 className="text-[11px] font-semibold tracking-wide text-faint uppercase">
            About {tool.heading}
          </h2>
          <div className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-muted">
            {about}
          </div>
        </section>

        <Faq items={tool.faq} />

        <RelatedTools slug={tool.slug} />
      </div>
    </>
  );
}
