import type { Metadata } from "next";
import { ExtractPagesTool } from "./ExtractPagesTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("extract-pages-pdf");

export const metadata: Metadata = {
  title: TOOL.metaTitle,
  description: TOOL.metaDescription,
  alternates: { canonical: `/${TOOL.slug}` },
  openGraph: {
    title: TOOL.metaTitle,
    description: TOOL.metaDescription,
    url: `/${TOOL.slug}`,
  },
};

export default function ExtractPagesPdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Extracting is the opposite of deleting: instead of saying what to
            remove, you say what to keep. It is the quickest way to pull a few
            important pages out of a long document.
          </p>
          <p>
            Select the pages you need and save them as a new PDF. Pages are
            copied byte for byte, so the extracted file looks exactly like the
            original — no re-encoding, no quality loss.
          </p>
        </>
      }
    >
      <ExtractPagesTool />
    </ToolPageLayout>
  );
}
