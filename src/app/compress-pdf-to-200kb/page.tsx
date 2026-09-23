import type { Metadata } from "next";
import {
  buildTargetMetadata,
  CompressTargetPage,
} from "@/components/CompressTargetPage";
import { getCompressTarget } from "@/lib/compressTargets";

const TARGET = getCompressTarget("200kb")!;

export const metadata: Metadata = buildTargetMetadata(TARGET);

export default function Page() {
  return <CompressTargetPage target={TARGET} />;
}
