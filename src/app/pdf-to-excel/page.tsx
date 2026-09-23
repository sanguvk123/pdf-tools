import type { Metadata } from "next";
import { ConvertTool } from "@/components/ConvertTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("pdf-to-excel");

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

export default function PdfToExcelPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Financial statements, invoices and reports arrive as PDFs, but the
            numbers inside them are only useful once they are in a spreadsheet
            where you can sort, total and chart them.
          </p>
          <p>
            Column boundaries are detected from the spacing in the original
            document and written out as a spreadsheet file that opens in Excel,
            Numbers, Google Sheets and LibreOffice Calc. Tables with clear
            columns convert most accurately; unusual layouts may need a little
            tidying.
          </p>
          <p>
            A scanned page holds pixels rather than data, so there is nothing to
            extract from it. We report those pages rather than returning a
            misleading empty sheet.
          </p>
        </>
      }
    >
      <ConvertTool tool={TOOL} target="csv" />
    </ToolPageLayout>
  );
}
