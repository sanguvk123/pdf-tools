import { describe, expect, it } from "vitest";
import { buildCsv, buildDocx, buildPlainText } from "@/server/buildDocuments";
import type { ExtractedDocument } from "@/server/extractText";

function documentOf(pages: string[][]): ExtractedDocument {
  return {
    pages: pages.map((lines, index) => ({ pageNumber: index + 1, lines })),
    emptyPageCount: pages.filter((lines) => lines.length === 0).length,
  };
}

async function textOf(blob: Blob): Promise<string> {
  return new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()));
}

describe("buildDocx", () => {
  it("produces a ZIP package containing the required OPC parts", async () => {
    const blob = await buildDocx(documentOf([["Hello world"]]));
    const raw = await textOf(blob);

    // ZIP local header signature "PK\x03\x04".
    expect(raw.startsWith("PK")).toBe(true);
    expect(raw).toContain("[Content_Types].xml");
    expect(raw).toContain("word/document.xml");
    expect(raw).toContain("_rels/.rels");
  });

  it("writes the extracted text into the document body", async () => {
    const blob = await buildDocx(documentOf([["First line", "Second line"]]));
    const raw = await textOf(blob);

    expect(raw).toContain("First line");
    expect(raw).toContain("Second line");
  });

  it("escapes XML-significant characters so the package stays valid", async () => {
    const blob = await buildDocx(documentOf([['Profit & loss <2024> "final"']]));
    const raw = await textOf(blob);

    expect(raw).toContain("Profit &amp; loss &lt;2024&gt;");
    // The raw, unescaped form must not appear in the body text.
    expect(raw).not.toContain("Profit & loss <2024>");
  });

  it("separates source pages with a page break", async () => {
    const blob = await buildDocx(documentOf([["Page one"], ["Page two"]]));
    const raw = await textOf(blob);

    expect(raw).toContain('w:type="page"');
  });

  it("handles a document with no text at all", async () => {
    const blob = await buildDocx(documentOf([[]]));

    expect(blob.size).toBeGreaterThan(0);
  });
});

describe("buildCsv", () => {
  it("splits columns on runs of whitespace", async () => {
    const csv = await textOf(buildCsv(documentOf([["Item    Qty    Price"]])));

    expect(csv).toContain("Item,Qty,Price");
  });

  it("keeps single spaces inside a cell", async () => {
    const csv = await textOf(buildCsv(documentOf([["Office chair    2"]])));

    expect(csv).toContain("Office chair,2");
  });

  it("quotes cells containing a comma", async () => {
    const csv = await textOf(buildCsv(documentOf([["Smith, John    42"]])));

    expect(csv).toContain('"Smith, John",42');
  });

  it("escapes embedded quotes by doubling them", async () => {
    const csv = await textOf(buildCsv(documentOf([['He said "yes"    1']])));

    expect(csv).toContain('"He said ""yes""",1');
  });

  it("starts with a BOM so Excel reads UTF-8 correctly", async () => {
    const blob = buildCsv(documentOf([["Café    1"]]));
    const bytes = new Uint8Array(await blob.arrayBuffer());

    // Inspect raw bytes: TextDecoder strips the BOM during decoding.
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("joins rows with CRLF", async () => {
    const csv = await textOf(buildCsv(documentOf([["a", "b"]])));

    expect(csv).toContain("a\r\nb");
  });
});

describe("buildPlainText", () => {
  it("keeps the extracted lines in order", async () => {
    const txt = await textOf(
      buildPlainText(documentOf([["First line", "Second line"]])),
    );

    expect(txt).toContain("First line\nSecond line");
  });

  it("marks each page so quotes can be traced back to a source page", async () => {
    const txt = await textOf(
      buildPlainText(documentOf([["Opening"], ["Appendix"]])),
    );

    expect(txt).toContain("--- Page 1 ---");
    expect(txt).toContain("--- Page 2 ---");
    // Page 1 must come first, and its content must sit under its own marker.
    expect(txt.indexOf("Opening")).toBeLessThan(txt.indexOf("--- Page 2 ---"));
  });

  it("labels pages with no selectable text instead of leaving a silent gap", async () => {
    const txt = await textOf(buildPlainText(documentOf([["Readable"], []])));

    expect(txt).toContain("[No selectable text on this page]");
  });
});
