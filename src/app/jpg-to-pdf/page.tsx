import type { Metadata } from "next";
import { ImagesToPdfTool } from "@/components/ImagesToPdfTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("jpg-to-pdf");

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

export default function JpgToPdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Photos of documents are easy to take and awkward to send. A folder
            of loose JPGs looks unprofessional, arrives out of order, and often
            will not upload where a PDF is required.
          </p>
          <p>
            Add your images, drag them into the right order, and download a
            single PDF. Keep each page the size of its image, or normalise
            everything to A4 or Letter if the result is going to be printed.
          </p>
        </>
      }
    >
      <ImagesToPdfTool tool={TOOL} />
    </ToolPageLayout>
  );
}
