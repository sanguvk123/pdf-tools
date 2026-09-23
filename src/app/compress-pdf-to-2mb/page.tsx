import type { Metadata } from "next";
import {
  buildTargetMetadata,
  CompressTargetPage,
} from "@/components/CompressTargetPage";
import { getCompressTarget } from "@/lib/compressTargets";

const TARGET = getCompressTarget("2mb")!;

export const metadata: Metadata = buildTargetMetadata(TARGET);

export default function Page() {
  return <CompressTargetPage target={TARGET} />;
}
