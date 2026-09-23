import type { Metadata } from "next";
import { SplitTool } from "./SplitTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("split-pdf");

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

export default function SplitPdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Splitting is useful when only part of a document matters: a single
            signed page from a contract, one chapter from a long report, or a
            receipt buried inside a bank statement.
          </p>
          <p>
            Pick the pages you want and save them as one new PDF, or split every
            page into its own file. Pages are copied across without
            re-encoding, so text stays selectable and images keep their original
            quality.
          </p>
        </>
      }
    >
      <SplitTool />
    </ToolPageLayout>
  );
}
