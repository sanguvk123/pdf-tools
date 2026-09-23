import { NextResponse } from "next/server";
import { ToolError } from "@/lib/errors";
import { stripExtension } from "@/lib/format";
import { extractText } from "@/server/extractText";
import { buildCsv, buildDocx, buildPlainText } from "@/server/buildDocuments";

/**
 * Conversion endpoint for the tools that cannot run in the browser.
 *
 * Streams the result straight back rather than storing it: there is no job
 * queue to poll and no copy of the user's document left on disk.
 */

export const runtime = "nodejs";
// Conversion depends entirely on the uploaded file, so caching is meaningless.
export const dynamic = "force-dynamic";

const MAX_BYTES = 100 * 1000 * 1000;

const TARGETS = {
  docx: {
    extension: "docx",
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  csv: { extension: "csv", contentType: "text/csv;charset=utf-8" },
  txt: { extension: "txt", contentType: "text/plain;charset=utf-8" },
} as const;

type Target = keyof typeof TARGETS;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const target = String(form.get("target") ?? "") as Target;

    if (!(file instanceof File)) {
      throw new ToolError("NO_FILES");
    }
    if (!(target in TARGETS)) {
      throw new ToolError("UNSUPPORTED_FILE");
    }
    if (file.size > MAX_BYTES) {
      throw new ToolError("FILE_TOO_LARGE");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const document = await extractText(bytes);

    let blob: Blob;
    if (target === "docx") {
      blob = await buildDocx(document);
    } else if (target === "txt") {
      blob = buildPlainText(document);
    } else {
      blob = buildCsv(document);
    }

    const { extension, contentType } = TARGETS[target];
    const filename = `${stripExtension(file.name)}.${extension}`;

    return new NextResponse(blob.stream(), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Surfaced to the user as "3 pages had no selectable text".
        "X-Empty-Pages": String(document.emptyPageCount),
        "X-Page-Count": String(document.pages.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Unexpected failures are logged server-side for diagnosis but never
    // described to the client.
    if (!(error instanceof ToolError)) {
      console.error("[convert] unexpected failure", error);
    } else if (error.code === "CORRUPT_FILE") {
      console.error("[convert] corrupt file", error.detail, error.cause);
    }

    // Only our own error codes cross the boundary. Anything unexpected is
    // reported as a generic failure so no internal detail leaks to the client.
    const code = error instanceof ToolError ? error.code : "UNKNOWN";
    const status = code === "FILE_TOO_LARGE" ? 413 : 400;

    return NextResponse.json({ code }, { status });
  }
}
