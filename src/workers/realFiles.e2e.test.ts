/**
 * End-to-end checks against real-world files rather than fixtures this suite
 * generated itself.
 *
 * The existing pdfOperations tests build their inputs with pdf-lib, which is
 * also what the operations use to read them. That proves the round trip is
 * self-consistent but cannot catch anything that only appears in documents
 * produced by other software — compressed object streams, unusual page trees,
 * inherited resources, fonts referenced rather than embedded. These files come
 * from Apple's PDF toolchain and from a hand-written PDF, so they exercise the
 * reading path the way a user's own file would.
 *
 * Skipped automatically when the corpus is absent, since testdata/ is not
 * committed. That keeps CI green without pretending the checks ran.
 */
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  compressPdf,
  deletePages,
  extractPages,
  mergePdfs,
  readPageCount,
  reorderPdf,
  rotatePdf,
  splitPdf,
  type OperationContext,
} from "@/workers/pdfOperations";

const DIR = new URL("../../testdata/", import.meta.url).pathname;
const has = (name: string) => existsSync(`${DIR}${name}`);

function load(name: string, type = "application/pdf"): File {
  return new File([new Uint8Array(readFileSync(`${DIR}${name}`))], name, { type });
}

function context(overrides: Partial<OperationContext> = {}): OperationContext {
  return { report: () => {}, throwIfCancelled: () => {}, ...overrides };
}

/** Re-parses the output, so a structurally broken result cannot pass. */
async function pagesOf(blob: Blob): Promise<number> {
  const document = await PDFDocument.load(await blob.arrayBuffer(), {
    ignoreEncryption: true,
  });
  return document.getPageCount();
}

/** Page sizes identify pages across an operation without needing text. */
async function sizesOf(blob: Blob): Promise<string[]> {
  const document = await PDFDocument.load(await blob.arrayBuffer(), {
    ignoreEncryption: true,
  });
  return document
    .getPages()
    .map((page) => `${Math.round(page.getWidth())}x${Math.round(page.getHeight())}`);
}

const CORPUS = has("real-ack.pdf") && has("real-small.pdf");

describe.skipIf(!CORPUS)("real-world PDFs from other producers", () => {
  it("reads the page count other software reports", async () => {
    // `file` independently reports 7 and 1 pages for these documents.
    expect(await readPageCount(load("real-ack.pdf"))).toBe(7);
    expect(await readPageCount(load("real-small.pdf"))).toBe(1);
  });

  it("merges two real documents, keeping every page", async () => {
    const result = await mergePdfs(
      [load("real-ack.pdf"), load("real-small.pdf")],
      context(),
    );

    expect(result.outputs).toHaveLength(1);
    expect(await pagesOf(result.outputs[0].blob)).toBe(8);
  });

  it("splits a real 7-page document into 7 individually readable files", async () => {
    const result = await splitPdf(
      load("real-ack.pdf"),
      { mode: "every-page", pages: [], ranges: "" },
      context(),
    );

    expect(result.outputs).toHaveLength(7);
    // Each output is parsed separately: a split that produced 7 blobs but
    // corrupted one would otherwise look like a pass.
    for (const output of result.outputs) {
      expect(await pagesOf(output.blob)).toBe(1);
    }
  });

  it("extracts exactly the requested pages from a real document", async () => {
    const original = await sizesOf(new Blob([readFileSync(`${DIR}real-ack.pdf`)]));

    const result = await extractPages(load("real-ack.pdf"), [2, 3, 4], context());

    expect(await pagesOf(result.outputs[0].blob)).toBe(3);
    // The right pages, not merely the right number of them.
    expect(await sizesOf(result.outputs[0].blob)).toEqual(original.slice(1, 4));
  });

  it("deletes pages from a real document and keeps the rest in order", async () => {
    const original = await sizesOf(new Blob([readFileSync(`${DIR}real-ack.pdf`)]));

    const result = await deletePages(load("real-ack.pdf"), [1, 2], context());

    expect(await pagesOf(result.outputs[0].blob)).toBe(5);
    expect(await sizesOf(result.outputs[0].blob)).toEqual(original.slice(2));
  });

  it("reverses a real document without losing or duplicating pages", async () => {
    const original = await sizesOf(new Blob([readFileSync(`${DIR}real-ack.pdf`)]));

    const result = await reorderPdf(
      load("real-ack.pdf"),
      [7, 6, 5, 4, 3, 2, 1],
      context(),
    );

    expect(await sizesOf(result.outputs[0].blob)).toEqual([...original].reverse());
  });

  it("rotates a real document and records the rotation", async () => {
    const result = await rotatePdf(
      load("real-ack.pdf"),
      { angle: 90, pages: [] },
      context(),
    );

    const document = await PDFDocument.load(await result.outputs[0].blob.arrayBuffer());
    expect(document.getPageCount()).toBe(7);
    expect(document.getPage(0).getRotation().angle).toBe(90);
  });

  it("compresses a real document without corrupting it", async () => {
    const result = await compressPdf(load("real-ack.pdf"), "recommended", context());

    expect(await pagesOf(result.outputs[0].blob)).toBe(7);
  });

  it("strips identifying metadata when compressing a real document", async () => {
    // The source carries a real document title and authoring app:
    //   /Title (iMovie macOS Acks 11.11.2020) /Creator (Pages)
    // Those describe the user's document and must not survive.
    const result = await compressPdf(load("real-ack.pdf"), "smallest", context());

    const document = await PDFDocument.load(await result.outputs[0].blob.arrayBuffer());
    expect(document.getTitle() ?? "").toBe("");
    expect(document.getAuthor() ?? "").toBe("");
    expect(document.getCreator() ?? "").toBe("");
    expect(document.getSubject() ?? "").toBe("");

    // Producer is deliberately not asserted empty. setProducer("") is honoured,
    // but pdf-lib stamps its own name back on during save, so the output always
    // reads "pdf-lib (…)". That names the library, not the user or their
    // document, so it is a tool fingerprint rather than a metadata leak.
    expect(document.getProducer() ?? "").not.toContain("iMovie");
    expect(document.getProducer() ?? "").not.toContain("macOS Version");
  });

  it("reports a truncated real file as a failure rather than producing junk", async () => {
    if (!has("corrupt-truncated.pdf")) return;

    await expect(readPageCount(load("corrupt-truncated.pdf"))).rejects.toThrow();
  });

  it("refuses a real JPEG handed to a PDF operation", async () => {
    if (!has("real-photo.jpg")) return;

    await expect(
      readPageCount(load("real-photo.jpg", "image/jpeg")),
    ).rejects.toThrow();
  });
});

describe("pdf.js worker configuration", () => {
  /**
   * Guards the defect that made pdf-to-jpg and pdf-to-png reject every valid
   * PDF with "We couldn't read this PDF. The file may be damaged."
   *
   * The cause was `GlobalWorkerOptions.workerSrc = ""`, added on the reasoning
   * that the surrounding Web Worker made pdf.js's own worker unnecessary. An
   * empty workerSrc does not disable the worker; getDocument() throws
   * `No "GlobalWorkerOptions.workerSrc" specified.`, which the catch block
   * turned into CORRUPT_FILE and blamed on the user's document.
   *
   * This asserts on source text because the failure is a bundling and runtime
   * concern that Node cannot execute: pdfToImages needs OffscreenCanvas and a
   * real worker. A cheap check that pins the exact regression is worth more
   * than no check at all, and it states plainly what must not come back.
   */
  it("does not disable the pdf.js worker by blanking workerSrc", () => {
    const source = readFileSync(
      new URL("./imageOperations.ts", import.meta.url).pathname,
      "utf8",
    );

    // Comments are stripped first: the fix is documented by quoting the bad
    // line, and scanning raw text would match that explanation and fail on
    // correct code. Only real statements should be inspected.
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    expect(code).not.toMatch(/workerSrc\s*=\s*["'`]\s*["'`]/);
    // workerPort is set from a Worker built with new URL(..., import.meta.url)
    // so the bundler emits and rewrites the asset; a bare path string would
    // not survive the build.
    expect(code).toMatch(/GlobalWorkerOptions\.workerPort\s*=\s*new Worker\(/);
    expect(code).toMatch(
      /new URL\(\s*["'`]pdfjs-dist\/build\/pdf\.worker\.mjs["'`],\s*import\.meta\.url/,
    );
  });
});

describe.skipIf(!has("real-license.pdf"))("a large real document", () => {
  it("handles a 310-page document end to end", async () => {
    const file = load("real-license.pdf");

    expect(await readPageCount(file)).toBe(310);

    const result = await splitPdf(
      file,
      { mode: "extract", pages: [1, 150, 310], ranges: "" },
      context(),
    );
    expect(await pagesOf(result.outputs[0].blob)).toBe(3);
  }, 60_000);
});
