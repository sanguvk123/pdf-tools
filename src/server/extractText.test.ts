import { describe, expect, it } from "vitest";
import { extractText } from "@/server/extractText";
import { PDFDocument, StandardFonts } from "pdf-lib";

/**
 * These exercise the real pdf.js text layer against generated PDFs, which is
 * how the column-gap regression was originally caught: text extraction
 * "worked" while silently merging every table column together.
 */

interface Line {
  text: string;
  x: number;
  y: number;
}

async function pdfWithLines(lines: Line[]): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const page = document.addPage([595, 842]);

  for (const line of lines) {
    page.drawText(line.text, { x: line.x, y: line.y, size: 12, font });
  }

  return document.save();
}

describe("extractText", () => {
  it("returns text in reading order, top to bottom", async () => {
    const bytes = await pdfWithLines([
      { text: "First", x: 50, y: 780 },
      { text: "Second", x: 50, y: 750 },
      { text: "Third", x: 50, y: 720 },
    ]);

    const result = await extractText(bytes);

    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].lines).toEqual(["First", "Second", "Third"]);
  });

  it("preserves column gaps so tables can be split into cells", async () => {
    // Three widely separated pieces of text on one baseline: a table row.
    const bytes = await pdfWithLines([
      { text: "Chair", x: 50, y: 700 },
      { text: "2", x: 200, y: 700 },
      { text: "120.00", x: 320, y: 700 },
    ]);

    const result = await extractText(bytes);
    const row = result.pages[0].lines[0];

    // Wide gaps must survive as a double space; splitting on them recovers
    // the original cells.
    expect(row.split(/\s{2,}/)).toEqual(["Chair", "2", "120.00"]);
  });

  it("keeps ordinary word spacing inside a single cell", async () => {
    const bytes = await pdfWithLines([{ text: "Office chair", x: 50, y: 700 }]);

    const result = await extractText(bytes);

    expect(result.pages[0].lines[0]).toBe("Office chair");
    expect(result.pages[0].lines[0].split(/\s{2,}/)).toHaveLength(1);
  });

  it("reports pages that contain no selectable text", async () => {
    const document = await PDFDocument.create();
    document.addPage([595, 842]); // page 1: blank
    const font = await document.embedFont(StandardFonts.Helvetica);
    document.addPage([595, 842]).drawText("Has text", { x: 50, y: 700, size: 12, font });

    const result = await extractText(await document.save());

    expect(result.pages).toHaveLength(2);
    expect(result.emptyPageCount).toBe(1);
  });

  it("rejects a document with no text anywhere rather than returning nothing", async () => {
    const document = await PDFDocument.create();
    document.addPage([595, 842]);

    await expect(extractText(await document.save())).rejects.toMatchObject({
      code: "NO_TEXT_CONTENT",
    });
  });

  it("reports unreadable bytes as a corrupt file", async () => {
    const notAPdf = new TextEncoder().encode("this is not a pdf");

    await expect(extractText(notAPdf)).rejects.toMatchObject({
      code: "CORRUPT_FILE",
    });
  });
});
