import type { Metadata } from "next";
import { ImagesToPdfTool } from "@/components/ImagesToPdfTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("image-to-pdf");

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

export default function ImageToPdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            Screenshots arrive as PNG, phones produce WebP and HEIC, older
            scanners still emit BMP. Collecting them into one document normally
            means converting each one first.
          </p>
          <p>
            This tool accepts any image your browser can display and handles the
            conversion for you. Transparent areas are placed on a white page so
            nothing turns black, and you can mix formats freely in a single
            document.
          </p>
        </>
      }
    >
      <ImagesToPdfTool tool={TOOL} />
    </ToolPageLayout>
  );
}
