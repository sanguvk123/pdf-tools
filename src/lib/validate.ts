import { ToolError } from "@/lib/errors";
import { formatBytes } from "@/lib/format";
import type { Tool } from "@/lib/tools";

/** Hard ceiling on batch size, to keep browser memory predictable. */
const MAX_FILES = 40;

const PDF_MAGIC = "%PDF-";

/**
 * Cheap, synchronous checks based on name and size. Runs the moment a file is
 * selected so the user learns about a problem before anything uploads.
 */
export function validateFiles(files: File[], tool: Tool): void {
  if (files.length === 0) throw new ToolError("NO_FILES");

  if (files.length > MAX_FILES) {
    throw new ToolError(
      "TOO_MANY_FILES",
      `This tool handles up to ${MAX_FILES} files at once. Remove a few and try again.`,
    );
  }

  const limitBytes = tool.maxFileSizeMb * 1000 * 1000;

  for (const file of files) {
    if (!matchesAccept(file, tool.accept)) {
      throw new ToolError(
        "UNSUPPORTED_FILE",
        `${file.name} isn't a ${tool.acceptLabel} file. Choose a ${tool.acceptLabel} file and try again.`,
      );
    }

    if (file.size > limitBytes) {
      throw new ToolError(
        "FILE_TOO_LARGE",
        `${file.name} is ${formatBytes(file.size)}. This tool handles files up to ${tool.maxFileSizeMb} MB.`,
      );
    }

    if (file.size === 0) {
      throw new ToolError("CORRUPT_FILE", `${file.name} is empty.`);
    }
  }
}

/**
 * Matches a file against an <input accept> string. Browsers apply this to the
 * file picker, but drag-and-drop bypasses it entirely, so we re-check here.
 */
export function matchesAccept(file: File, accept: string): boolean {
  const patterns = accept
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);

  if (patterns.length === 0) return true;

  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return name.endsWith(pattern);
    if (pattern.endsWith("/*")) return type.startsWith(pattern.slice(0, -1));
    return type === pattern;
  });
}

/**
 * Confirms the bytes really are a PDF. A file can be named .pdf and contain
 * anything, and a misleading error much later is a poor experience.
 */
export async function isProbablyPdf(file: File): Promise<boolean> {
  const header = await file.slice(0, 5).text();
  return header === PDF_MAGIC;
}

/**
 * Detects standard PDF encryption by looking for an /Encrypt entry in the
 * trailer. Scans the tail of the file, where the trailer lives, so the whole
 * document never has to be read into memory.
 */
export async function isEncryptedPdf(file: File): Promise<boolean> {
  const tailSize = Math.min(file.size, 4096);
  const tail = await file.slice(file.size - tailSize).text();
  return /\/Encrypt[\s\d<]/.test(tail);
}
