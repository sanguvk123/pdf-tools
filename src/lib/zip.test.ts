import { describe, expect, it } from "vitest";
import { createZip } from "@/lib/zip";

/** Reads a little-endian uint32 from a byte array. */
function readU32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, true);
}

function readU16(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint16(offset, true);
}

describe("createZip", () => {
  it("writes a valid archive structure for multiple entries", async () => {
    const blob = await createZip([
      { filename: "page-1.pdf", blob: new Blob(["first"]) },
      { filename: "page-2.pdf", blob: new Blob(["second"]) },
    ]);

    const bytes = new Uint8Array(await blob.arrayBuffer());

    // Local file header signature at the start.
    expect(readU32(bytes, 0)).toBe(0x04034b50);

    // End-of-central-directory record is the last 22 bytes.
    const end = bytes.length - 22;
    expect(readU32(bytes, end)).toBe(0x06054b50);
    expect(readU16(bytes, end + 8)).toBe(2);
    expect(readU16(bytes, end + 10)).toBe(2);

    // The recorded central directory offset must point at a real record.
    const centralOffset = readU32(bytes, end + 16);
    expect(readU32(bytes, centralOffset)).toBe(0x02014b50);
  });

  it("stores entry names and sizes accurately", async () => {
    const content = "hello zip";
    const blob = await createZip([
      { filename: "note.txt", blob: new Blob([content]) },
    ]);

    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(readU16(bytes, 26)).toBe("note.txt".length);
    expect(readU32(bytes, 18)).toBe(content.length); // compressed size
    expect(readU32(bytes, 22)).toBe(content.length); // uncompressed size

    const name = new TextDecoder().decode(bytes.slice(30, 30 + 8));
    expect(name).toBe("note.txt");

    const stored = new TextDecoder().decode(bytes.slice(38, 38 + content.length));
    expect(stored).toBe(content);
  });

  it("computes a CRC32 matching the known reference value", async () => {
    // CRC32 of "123456789" is the standard check value 0xCBF43926.
    const blob = await createZip([
      { filename: "check", blob: new Blob(["123456789"]) },
    ]);

    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(readU32(bytes, 14)).toBe(0xcbf43926);
  });

  it("produces an empty-but-valid archive for no entries", async () => {
    const blob = await createZip([]);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(bytes.length).toBe(22);
    expect(readU32(bytes, 0)).toBe(0x06054b50);
    expect(readU16(bytes, 8)).toBe(0);
  });
});
