import type { Metadata } from "next";
import { ImagesToPdfTool } from "@/components/ImagesToPdfTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("png-to-pdf");

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

export default function PngToPdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            PNGs are usually screenshots, exported designs or diagrams, and they
            tend to arrive as a pile of separate files. Collecting them into one
            PDF makes them easier to send, easier to read in order, and
            acceptable to the many upload forms that will not take an image.
          </p>
          <p>
            Drop in your images, drag them into the order you want, and download
            a single document. Each page can match the size of its image, or you
            can normalise everything to A4 or Letter for printing. Transparent
            areas are flattened onto white, since PDF pages are opaque. To
            combine several different image formats in one go, use{" "}
            <a href="/image-to-pdf">Image to PDF</a>.
          </p>
        </>
      }
    >
      <ImagesToPdfTool tool={TOOL} />
    </ToolPageLayout>
  );
}
