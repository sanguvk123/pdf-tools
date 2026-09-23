import type { ToolOutput } from "@/lib/types";

/**
 * Minimal ZIP writer (store mode, no compression).
 *
 * Loaded on demand, and only when a tool produces more than one file. The
 * payloads are already-compressed PDFs and JPEGs, so deflating them would cost
 * CPU time for almost no size saving — storing is both faster and simpler than
 * pulling in a compression dependency.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index++) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** DOS time/date format used by the ZIP local header. */
function dosDateTime(date: Date): { time: number; date: number } {
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

interface Entry {
  nameBytes: Uint8Array;
  data: Uint8Array;
  crc: number;
  offset: number;
}

export async function createZip(outputs: ToolOutput[]): Promise<Blob> {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(new Date());

  const chunks: Uint8Array[] = [];
  const entries: Entry[] = [];
  let offset = 0;

  for (const output of outputs) {
    const data = new Uint8Array(await output.blob.arrayBuffer());
    const nameBytes = encoder.encode(output.filename);
    const crc = crc32(data);

    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true); // local file header signature
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(8, 0, true); // method: store
    view.setUint16(10, time, true);
    view.setUint16(12, date, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true); // compressed size
    view.setUint32(22, data.length, true); // uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // extra field length
    header.set(nameBytes, 30);

    entries.push({ nameBytes, data, crc, offset });
    chunks.push(header, data);
    offset += header.length + data.length;
  }

  const centralStart = offset;

  for (const entry of entries) {
    const record = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(record.buffer);

    view.setUint32(0, 0x02014b50, true); // central directory signature
    view.setUint16(4, 20, true); // version made by
    view.setUint16(6, 20, true); // version needed
    view.setUint16(8, 0x0800, true); // UTF-8 filename flag
    view.setUint16(10, 0, true); // method: store
    view.setUint16(12, time, true);
    view.setUint16(14, date, true);
    view.setUint32(16, entry.crc, true);
    view.setUint32(20, entry.data.length, true);
    view.setUint32(24, entry.data.length, true);
    view.setUint16(28, entry.nameBytes.length, true);
    view.setUint32(42, entry.offset, true); // local header offset
    record.set(entry.nameBytes, 46);

    chunks.push(record);
    offset += record.length;
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);

  endView.setUint32(0, 0x06054b50, true); // end of central directory
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, offset - centralStart, true); // central directory size
  endView.setUint32(16, centralStart, true); // central directory offset

  chunks.push(end);

  return new Blob(chunks as BlobPart[], { type: "application/zip" });
}
