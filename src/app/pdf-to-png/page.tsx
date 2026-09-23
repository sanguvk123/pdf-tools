import type { Metadata } from "next";
import { PdfToPngTool } from "./PdfToPngTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("pdf-to-png");

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

export default function PdfToPngPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            PNG is the right choice when sharpness matters more than file size.
            Because it is lossless, text stays crisp and diagrams keep clean
            edges, with none of the soft halos JPEG can leave around lettering.
            That makes it a good fit for screenshots, slides, invoices and
            anything with fine line work.
          </p>
          <p>
            Every page is rendered at roughly 150 DPI and returned as a separate
            image; multi-page documents arrive as a single ZIP. The conversion
            runs inside your browser, so even a long document never leaves your
            device and there is no upload to wait for. If your pages are mostly
            photographs, <a href="/pdf-to-jpg">PDF to JPG</a> will give you much
            smaller files for very similar visible quality.
          </p>
        </>
      }
    >
      <PdfToPngTool />
    </ToolPageLayout>
  );
}
