import type { Metadata } from "next";
import { MergeTool } from "./MergeTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("merge-pdf");

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

export default function MergePdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Combining PDFs is the most common thing people need to do with a
            document, and it should not require an account or a desktop app.
            Add your files, drag them into the order you want, and download a
            single merged document.
          </p>
          <p>
            Merging happens entirely inside your browser. Nothing is uploaded,
            which means there is no waiting on a connection and no copy of your
            document sitting on someone else&apos;s server. Page quality is
            untouched: pages are copied across exactly as they are, with no
            re-encoding.
          </p>
        </>
      }
    >
      <MergeTool />
    </ToolPageLayout>
  );
}
