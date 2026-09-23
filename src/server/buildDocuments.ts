import "server-only";
import { createZip } from "@/lib/zip";
import type { ExtractedDocument } from "@/server/extractText";

/**
 * Document builders for the conversion tools.
 *
 * A .docx is an OPC package: a ZIP containing a handful of XML parts. Writing
 * those parts directly keeps the server dependency-free and fast, and reuses
 * the ZIP writer the client tools already rely on.
 */

/** Escapes text for inclusion in XML content. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function textBlob(content: string, type: string): Blob {
  return new Blob([content], { type });
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

/** A single paragraph of body text. */
function paragraph(text: string): string {
  return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

/** An explicit page break, used between source pages. */
function pageBreak(): string {
  return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
}

export async function buildDocx(document: ExtractedDocument): Promise<Blob> {
  const body: string[] = [];

  document.pages.forEach((page, index) => {
    if (index > 0) body.push(pageBreak());

    if (page.lines.length === 0) {
      // Keep the page in the output so numbering still lines up with the PDF.
      body.push(paragraph(""));
      return;
    }

    for (const line of page.lines) body.push(paragraph(line));
  });

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body>
</w:document>`;

  return createZip([
    {
      filename: "[Content_Types].xml",
      blob: textBlob(CONTENT_TYPES, "application/xml"),
    },
    { filename: "_rels/.rels", blob: textBlob(ROOT_RELS, "application/xml") },
    {
      filename: "word/_rels/document.xml.rels",
      blob: textBlob(DOCUMENT_RELS, "application/xml"),
    },
    {
      filename: "word/document.xml",
      blob: textBlob(documentXml, "application/xml"),
    },
  ]);
}

/**
 * Builds a CSV from the extracted lines.
 *
 * CSV rather than XLSX: it opens natively in Excel, Numbers, Sheets and Calc,
 * and avoids guessing at a spreadsheet structure the PDF may not really have.
 */
export function buildCsv(document: ExtractedDocument): Blob {
  const rows: string[] = [];

  for (const page of document.pages) {
    for (const line of page.lines) {
      // Runs of two or more spaces usually indicate a column boundary in a
      // PDF table, which is the most reliable signal available without
      // full layout analysis.
      const cells = line.split(/\s{2,}/).map((cell) => cell.trim());
      rows.push(cells.map(escapeCsvCell).join(","));
    }
  }

  // BOM so Excel opens UTF-8 content with the correct encoding.
  return new Blob(["\ufeff" + rows.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
}

function escapeCsvCell(cell: string): string {
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

/**
 * Builds a plain .txt file from the extracted lines.
 *
 * Page boundaries are kept as a blank line and a marker. Extracted text is
 * usually being searched or quoted, and knowing which page a passage came
 * from is most of its value; collapsing everything into one stream would
 * throw that away for no benefit.
 */
export function buildPlainText(document: ExtractedDocument): Blob {
  const sections = document.pages.map((page, index) => {
    const heading = `--- Page ${index + 1} ---`;
    // A page with no selectable text is almost always a scan. Saying so is
    // more useful than an unexplained gap in the output.
    const body = page.lines.length
      ? page.lines.join("\n")
      : "[No selectable text on this page]";
    return `${heading}\n${body}`;
  });

  return new Blob([sections.join("\n\n")], {
    type: "text/plain;charset=utf-8",
  });
}
