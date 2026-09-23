import type { Metadata } from "next";
import { DeletePagesTool } from "./DeletePagesTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("delete-pages-pdf");

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

export default function DeletePagesPdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Blank pages from a scanner, a cover sheet nobody needs, an internal
            appendix you would rather not forward — removing pages is usually
            the last step before sending a document on.
          </p>
          <p>
            Select the pages to remove and download the tidied file. Your
            original is never modified, so you can always start again if you
            remove one page too many.
          </p>
        </>
      }
    >
      <DeletePagesTool />
    </ToolPageLayout>
  );
}
