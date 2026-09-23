import type { Metadata } from "next";
import { RotateTool } from "./RotateTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("rotate-pdf");

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

export default function RotatePdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Scanners and phone cameras often save pages sideways. Viewing them
            rotated is easy, but the file itself stays wrong, and anyone you
            send it to has to turn their head.
          </p>
          <p>
            Rotate the whole document or just the pages that are off, then save
            a corrected copy. The new orientation is stored in the file itself,
            so it opens correctly everywhere.
          </p>
        </>
      }
    >
      <RotateTool />
    </ToolPageLayout>
  );
}
