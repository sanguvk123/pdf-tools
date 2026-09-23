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
import { ToolError } from "@/lib/errors";

/** Builds a real in-memory PDF with the given number of pages. */
async function makePdfFile(name: string, pageCount: number): Promise<File> {
  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index++) {
    document.addPage([595, 842]);
  }
  const bytes = await document.save();
  return new File([bytes as BlobPart], name, { type: "application/pdf" });
}

async function pageCountOf(blob: Blob): Promise<number> {
  const document = await PDFDocument.load(await blob.arrayBuffer());
  return document.getPageCount();
}

function makeContext(overrides: Partial<OperationContext> = {}): OperationContext {
  return {
    report: () => {},
    throwIfCancelled: () => {},
    ...overrides,
  };
}

/**
 * Builds a PDF whose pages have distinct widths, so a page can be identified
 * by its size after being moved. Page N is (100 + N) points wide.
 */
async function makeTaggedPdf(pageCount: number): Promise<File> {
  const document = await PDFDocument.create();
  for (let index = 1; index <= pageCount; index++) {
    document.addPage([100 + index, 842]);
  }
  const bytes = await document.save();
  return new File([bytes as BlobPart], "tagged.pdf", {
    type: "application/pdf",
  });
}

/** Recovers the original page numbers from a tagged document, in order. */
async function pageTagsOf(blob: Blob): Promise<number[]> {
  const document = await PDFDocument.load(await blob.arrayBuffer());
  return document
    .getPages()
    .map((page) => Math.round(page.getWidth()) - 100);
}

describe("mergePdfs", () => {
  it("concatenates every page in file order", async () => {
    const files = [await makePdfFile("a.pdf", 2), await makePdfFile("b.pdf", 3)];

    const result = await mergePdfs(files, makeContext());

    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0].filename).toBe("merged.pdf");
    expect(await pageCountOf(result.outputs[0].blob)).toBe(5);
  });

  it("refuses a single file, since merging needs two", async () => {
    const files = [await makePdfFile("a.pdf", 1)];

    await expect(mergePdfs(files, makeContext())).rejects.toBeInstanceOf(ToolError);
  });

  it("reports progress for each file", async () => {
    const stages: string[] = [];
    const files = [await makePdfFile("a.pdf", 1), await makePdfFile("b.pdf", 1)];

    await mergePdfs(
      files,
      makeContext({ report: (progress) => stages.push(progress.stage) }),
    );

    expect(stages).toContain("Adding a.pdf");
    expect(stages).toContain("Adding b.pdf");
  });

  it("stops when cancelled mid-run", async () => {
    const files = [await makePdfFile("a.pdf", 1), await makePdfFile("b.pdf", 1)];
    let calls = 0;

    const cancelAfterFirst = makeContext({
      throwIfCancelled: () => {
        calls += 1;
        if (calls > 1) throw new ToolError("CANCELLED");
      },
    });

    await expect(mergePdfs(files, cancelAfterFirst)).rejects.toMatchObject({
      code: "CANCELLED",
    });
  });

  it("rejects a file that is not a real PDF", async () => {
    const notAPdf = new File(["plain text"], "fake.pdf", {
      type: "application/pdf",
    });
    const real = await makePdfFile("a.pdf", 1);

    await expect(mergePdfs([real, notAPdf], makeContext())).rejects.toMatchObject({
      code: "CORRUPT_FILE",
    });
  });
});

describe("splitPdf", () => {
  it("produces one file per page in every-page mode", async () => {
    const file = await makePdfFile("doc.pdf", 3);

    const result = await splitPdf(
      file,
      { mode: "every-page", pages: [], ranges: "" },
      makeContext(),
    );

    expect(result.outputs).toHaveLength(3);
    expect(result.outputs[0].filename).toBe("doc-page-1.pdf");
    expect(await pageCountOf(result.outputs[2].blob)).toBe(1);
  });

  it("extracts only the selected pages", async () => {
    const file = await makePdfFile("doc.pdf", 10);

    const result = await splitPdf(
      file,
      { mode: "extract", pages: [2, 4, 6], ranges: "" },
      makeContext(),
    );

    expect(result.outputs).toHaveLength(1);
    expect(await pageCountOf(result.outputs[0].blob)).toBe(3);
  });

  it("rejects an empty page selection", async () => {
    const file = await makePdfFile("doc.pdf", 3);

    await expect(
      splitPdf(file, { mode: "extract", pages: [], ranges: "" }, makeContext()),
    ).rejects.toMatchObject({ code: "EMPTY_SELECTION" });
  });

  it("ignores page numbers beyond the document", async () => {
    const file = await makePdfFile("doc.pdf", 3);

    const result = await splitPdf(
      file,
      { mode: "extract", pages: [1, 99], ranges: "" },
      makeContext(),
    );

    expect(await pageCountOf(result.outputs[0].blob)).toBe(1);
  });
});

describe("deletePages", () => {
  it("keeps everything that was not selected", async () => {
    const file = await makePdfFile("doc.pdf", 5);

    const result = await deletePages(file, [2, 3], makeContext());

    expect(await pageCountOf(result.outputs[0].blob)).toBe(3);
  });

  it("refuses to delete every page", async () => {
    const file = await makePdfFile("doc.pdf", 2);

    await expect(deletePages(file, [1, 2], makeContext())).rejects.toMatchObject({
      code: "EMPTY_SELECTION",
    });
  });

  it("refuses a no-op deletion", async () => {
    const file = await makePdfFile("doc.pdf", 2);

    await expect(deletePages(file, [], makeContext())).rejects.toMatchObject({
      code: "EMPTY_SELECTION",
    });
  });
});

describe("extractPages", () => {
  it("saves the selected pages as one document", async () => {
    const file = await makePdfFile("doc.pdf", 6);

    const result = await extractPages(file, [1, 5], makeContext());

    expect(await pageCountOf(result.outputs[0].blob)).toBe(2);
    expect(result.outputs[0].filename).toBe("doc-pages.pdf");
  });
});

describe("rotatePdf", () => {
  it("rotates every page when no selection is given", async () => {
    const file = await makePdfFile("doc.pdf", 2);

    const result = await rotatePdf(file, { angle: 90, pages: [] }, makeContext());
    const document = await PDFDocument.load(await result.outputs[0].blob.arrayBuffer());

    expect(document.getPage(0).getRotation().angle).toBe(90);
    expect(document.getPage(1).getRotation().angle).toBe(90);
  });

  it("rotates only the selected pages", async () => {
    const file = await makePdfFile("doc.pdf", 2);

    const result = await rotatePdf(file, { angle: 180, pages: [1] }, makeContext());
    const document = await PDFDocument.load(await result.outputs[0].blob.arrayBuffer());

    expect(document.getPage(0).getRotation().angle).toBe(180);
    expect(document.getPage(1).getRotation().angle).toBe(0);
  });

  it("wraps rotation around a full turn", async () => {
    const file = await makePdfFile("doc.pdf", 1);

    const once = await rotatePdf(file, { angle: 270, pages: [] }, makeContext());
    const rotatedFile = new File(
      [await once.outputs[0].blob.arrayBuffer()],
      "doc.pdf",
    );
    const twice = await rotatePdf(
      rotatedFile,
      { angle: 180, pages: [] },
      makeContext(),
    );

    const document = await PDFDocument.load(await twice.outputs[0].blob.arrayBuffer());
    expect(document.getPage(0).getRotation().angle).toBe(90);
  });
});

describe("compressPdf", () => {
  it("returns a readable PDF with the same page count", async () => {
    const file = await makePdfFile("doc.pdf", 4);

    const result = await compressPdf(file, "recommended", makeContext());

    expect(result.outputs[0].filename).toBe("doc-compressed.pdf");
    expect(await pageCountOf(result.outputs[0].blob)).toBe(4);
  });

  it("strips document metadata", async () => {
    const source = await PDFDocument.create();
    source.addPage([595, 842]);
    source.setTitle("Confidential Salary Review");
    source.setAuthor("Jane Doe");
    const file = new File([(await source.save()) as BlobPart], "doc.pdf");

    const result = await compressPdf(file, "recommended", makeContext());
    const output = await PDFDocument.load(await result.outputs[0].blob.arrayBuffer());

    expect(output.getTitle() ?? "").toBe("");
    expect(output.getAuthor() ?? "").toBe("");
  });
});

describe("readPageCount", () => {
  it("reports the real page count", async () => {
    const file = await makePdfFile("doc.pdf", 7);

    expect(await readPageCount(file)).toBe(7);
  });

  it("raises a corrupt-file error for unreadable bytes", async () => {
    const broken = new File(["not a pdf at all"], "broken.pdf");

    await expect(readPageCount(broken)).rejects.toMatchObject({
      code: "CORRUPT_FILE",
    });
  });
});

describe("reorderPdf", () => {
  it("places pages in the requested order", async () => {
    const file = await makeTaggedPdf(4);

    const result = await reorderPdf(file, [3, 1, 4, 2], makeContext());

    expect(await pageTagsOf(result.outputs[0].blob)).toEqual([3, 1, 4, 2]);
  });

  it("keeps every page, so nothing is silently lost", async () => {
    const file = await makeTaggedPdf(5);

    const result = await reorderPdf(file, [5, 4, 3, 2, 1], makeContext());

    expect(await pageCountOf(result.outputs[0].blob)).toBe(5);
  });

  it("names the output so the original is not overwritten", async () => {
    const file = await makeTaggedPdf(2);

    const result = await reorderPdf(file, [2, 1], makeContext());

    expect(result.outputs[0].filename).toBe("tagged-reordered.pdf");
  });

  it("rejects an order that duplicates a page", async () => {
    const file = await makeTaggedPdf(3);

    await expect(
      reorderPdf(file, [1, 2, 2], makeContext()),
    ).rejects.toBeInstanceOf(ToolError);
  });

  it("rejects an order that drops a page", async () => {
    const file = await makeTaggedPdf(3);

    await expect(reorderPdf(file, [2, 1], makeContext())).rejects.toBeInstanceOf(
      ToolError,
    );
  });

  it("rejects a page number outside the document", async () => {
    const file = await makeTaggedPdf(3);

    await expect(
      reorderPdf(file, [1, 2, 9], makeContext()),
    ).rejects.toBeInstanceOf(ToolError);
  });

  it("refuses an unchanged order rather than returning an identical file", async () => {
    const file = await makeTaggedPdf(3);

    await expect(
      reorderPdf(file, [1, 2, 3], makeContext()),
    ).rejects.toBeInstanceOf(ToolError);
  });

  it("stops when the user cancels", async () => {
    const file = await makeTaggedPdf(3);
    const context = makeContext({
      throwIfCancelled: () => {
        throw new ToolError("CANCELLED");
      },
    });

    await expect(reorderPdf(file, [3, 2, 1], context)).rejects.toMatchObject({
      code: "CANCELLED",
    });
  });
});
