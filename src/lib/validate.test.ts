import { describe, expect, it } from "vitest";
import { matchesAccept, validateFiles } from "@/lib/validate";
import { ToolError } from "@/lib/errors";
import { requireTool } from "@/lib/tools";

const mergeTool = requireTool("merge-pdf");
const imageTool = requireTool("image-to-pdf");

function makeFile(name: string, type: string, sizeBytes = 1024): File {
  const file = new File(["x"], name, { type });
  // File size is read-only, so define the size the validator will inspect.
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

describe("matchesAccept", () => {
  it("matches on MIME type", () => {
    expect(matchesAccept(makeFile("a.pdf", "application/pdf"), "application/pdf")).toBe(
      true,
    );
  });

  it("matches on extension when the browser reports no MIME type", () => {
    expect(matchesAccept(makeFile("a.PDF", ""), "application/pdf,.pdf")).toBe(true);
  });

  it("matches a wildcard group", () => {
    expect(matchesAccept(makeFile("a.webp", "image/webp"), "image/*")).toBe(true);
    expect(matchesAccept(makeFile("a.pdf", "application/pdf"), "image/*")).toBe(false);
  });

  it("rejects a mismatched file", () => {
    expect(matchesAccept(makeFile("a.txt", "text/plain"), "application/pdf,.pdf")).toBe(
      false,
    );
  });
});

describe("validateFiles", () => {
  it("accepts a valid file", () => {
    expect(() =>
      validateFiles([makeFile("a.pdf", "application/pdf")], mergeTool),
    ).not.toThrow();
  });

  it("rejects an empty selection", () => {
    expect(() => validateFiles([], mergeTool)).toThrow(ToolError);
  });

  it("rejects an unsupported type with a named, human message", () => {
    try {
      validateFiles([makeFile("notes.txt", "text/plain")], mergeTool);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      expect((error as ToolError).code).toBe("UNSUPPORTED_FILE");
      expect((error as ToolError).detail).toContain("notes.txt");
    }
  });

  it("rejects a file over the tool's size limit", () => {
    const tooBig = makeFile("big.pdf", "application/pdf", 101 * 1000 * 1000);

    try {
      validateFiles([tooBig], mergeTool);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as ToolError).code).toBe("FILE_TOO_LARGE");
    }
  });

  it("rejects a zero-byte file as corrupt", () => {
    try {
      validateFiles([makeFile("empty.pdf", "application/pdf", 0)], mergeTool);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as ToolError).code).toBe("CORRUPT_FILE");
    }
  });

  it("rejects an oversized batch", () => {
    const many = Array.from({ length: 41 }, (_, index) =>
      makeFile(`img${index}.png`, "image/png"),
    );

    try {
      validateFiles(many, imageTool);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as ToolError).code).toBe("TOO_MANY_FILES");
    }
  });
});
