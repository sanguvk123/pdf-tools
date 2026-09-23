import type { Metadata } from "next";
import { ConvertTool } from "@/components/ConvertTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("pdf-to-text");

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

export default function PdfToTextPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Sometimes you do not want a Word document or a spreadsheet, just the
            words. Extracting to plain text gives you something you can search,
            grep, paste into a message or feed to another program, with no
            formatting in the way and no application needed to open it.
          </p>
          <p>
            Text comes out in reading order, one line at a time, and each page
            is separated by a marker so you can still tell where a passage came
            from. Pages that turn out to be scans are labelled rather than left
            blank, so an empty result is never a mystery. If you need the table
            structure preserved, <a href="/pdf-to-excel">PDF to Excel</a> keeps
            columns intact; for an editable document,{" "}
            <a href="/pdf-to-word">PDF to Word</a> is the better fit.
          </p>
        </>
      }
    >
      <ConvertTool tool={TOOL} target="txt" />
    </ToolPageLayout>
  );
}
