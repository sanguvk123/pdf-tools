import type { ToolOutput } from "@/lib/types";

/** Triggers a browser download and releases the object URL afterwards. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoke on the next frame: revoking synchronously can cancel the download
  // in some browsers.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/**
 * Downloads a result. A single output downloads directly; several are zipped
 * so the user gets one file and one click rather than a popup-blocked burst.
 */
export async function downloadOutputs(
  outputs: ToolOutput[],
  zipName: string,
): Promise<void> {
  if (outputs.length === 0) return;

  if (outputs.length === 1) {
    downloadBlob(outputs[0].blob, outputs[0].filename);
    return;
  }

  const { createZip } = await import("@/lib/zip");
  downloadBlob(await createZip(outputs), zipName);
}
