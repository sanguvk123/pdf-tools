import type { Metadata } from "next";
import { CompressTool } from "./CompressTool";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { requireTool } from "@/lib/tools";

const TOOL = requireTool("compress-pdf");

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

export default function CompressPdfPage() {
  return (
    <ToolPageLayout
      tool={TOOL}
      about={
        <>
          <p>
            PDFs get large for predictable reasons: embedded fonts, high
            resolution scans, and the accumulated clutter left behind by the
            software that produced them. Compressing rewrites the document so
            that only what is needed to display it remains.
          </p>
          <p>
            Start with Recommended. It rebuilds the file structure, removes
            duplicated resources and strips metadata, while leaving text crisp
            and selectable. If you need to hit a strict email or upload limit,
            Smaller and Smallest trade image detail for a lighter file.
          </p>
          <p>
            Compression runs in your browser, so a 40 MB document does not need
            to be uploaded and downloaded again. Nothing is sent anywhere, and
            your original file is never modified.
          </p>
        </>
      }
    >
      <CompressTool />
    </ToolPageLayout>
  );
}
