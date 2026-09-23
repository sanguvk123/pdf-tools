import type { Metadata } from "next";
import {
  buildIntentMetadata,
  CompressIntentPage,
} from "@/components/CompressIntentPage";
import { getCompressIntent } from "@/lib/compressIntents";

const INTENT = getCompressIntent("compress-pdf-without-losing-quality")!;

export const metadata: Metadata = buildIntentMetadata(INTENT);

export default function Page() {
  return <CompressIntentPage intent={INTENT} />;
}
