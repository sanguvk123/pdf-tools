import type { Metadata } from "next";
import { ConvertTool } from "@/components/ConvertTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("pdf-to-word");

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

export default function PdfToWordPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            A PDF is designed to be read, not edited. When you need to change a
            sentence, reuse a paragraph or fix a typo in a document you no
            longer have the source for, converting to Word is the way back in.
          </p>
          <p>
            Your text comes across in reading order, page by page, as a .docx
            file that opens in Word, Google Docs, Pages and LibreOffice. Very
            complex layouts may need a little tidying afterwards, and pages
            that are scans contain no text to extract — we tell you when that
            happens instead of quietly returning an empty document.
          </p>
          <p>
            This conversion runs on our servers because it needs more than a
            browser can offer. Your file is processed in memory and never
            written to disk.
          </p>
        </>
      }
    >
      <ConvertTool tool={TOOL} target="docx" />
    </ToolPageLayout>
  );
}
