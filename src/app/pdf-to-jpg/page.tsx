import type { Metadata } from "next";
import { PdfToJpgTool } from "./PdfToJpgTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("pdf-to-jpg");

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

export default function PdfToJpgPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Images go where PDFs cannot: into a slide, a chat message, a
            web page, or a form that only accepts pictures. Converting a page
            to an image is often the fastest way to share what is on it.
          </p>
          <p>
            Every page is rendered at roughly 150 DPI, which stays sharp when
            zoomed and prints cleanly. Choose JPG for scans and photos, or PNG
            when the page is mostly text and diagrams. Multi-page documents
            arrive as a single ZIP.
          </p>
        </>
      }
    >
      <PdfToJpgTool />
    </ToolPageLayout>
  );
}
