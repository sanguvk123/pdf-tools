import type { Metadata } from "next";
import { ReorderTool } from "./ReorderTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("reorder-pdf-pages");

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

export default function ReorderPdfPagesPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Scanned documents come out back to front, appendices end up before
            the section they belong to, and signature pages land in the middle.
            Rearranging them should not mean exporting single pages and merging
            them back together in the right sequence.
          </p>
          <p>
            Every page appears as a tile you can drag into position, and each
            one also has arrows so the whole thing works without a mouse. Pages
            are copied across untouched, so nothing is re-encoded and the result
            looks exactly like the original — just in the order you wanted. To
            take pages out rather than move them, use{" "}
            <a href="/delete-pages-pdf">Delete pages</a>.
          </p>
        </>
      }
    >
      <ReorderTool />
    </ToolPageLayout>
  );
}
