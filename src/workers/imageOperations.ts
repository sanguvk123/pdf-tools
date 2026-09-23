import { PDFDocument } from "pdf-lib";
import { ToolError } from "@/lib/errors";
import { stripExtension } from "@/lib/format";
import type { ToolOutput } from "@/lib/types";
import type { OperationContext, OperationResult } from "@/workers/pdfOperations";

/**
 * Image pipeline.
 *
 * Loaded on demand by the worker, so routes that never touch images do not
 * pay for pdf.js or the rendering code. Uses OffscreenCanvas, which is
 * available inside a worker and keeps rasterisation off the main thread.
 */

/** Common page sizes in PDF points (72 per inch). */
const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

function requireOffscreenCanvas(width: number, height: number): OffscreenCanvas {
  if (typeof OffscreenCanvas === "undefined") {
    throw new ToolError(
      "UNKNOWN",
      "Your browser doesn't support image processing. Try Chrome, Edge or Safari 17+.",
    );
  }
  return new OffscreenCanvas(width, height);
}

/* ---------------- Images → PDF ---------------- */

interface ImagesToPdfOptions {
  /** "auto" matches each image; a named size normalises every page. */
  pageSize: string;
  /** Margin in points applied when a fixed page size is used. */
  margin: number;
}

export async function imagesToPdf(
  files: File[],
  options: ImagesToPdfOptions,
  context: OperationContext,
): Promise<OperationResult> {
  if (files.length === 0) throw new ToolError("NO_FILES");

  const document = await PDFDocument.create();

  for (let index = 0; index < files.length; index++) {
    context.throwIfCancelled();
    context.report({
      stage: `Adding image ${index + 1} of ${files.length}`,
      ratio: index / files.length,
    });

    const file = files[index];
    const { bytes, width, height, isPng } = await normalizeImage(file);

    const embedded = isPng
      ? await document.embedPng(bytes)
      : await document.embedJpg(bytes);

    if (options.pageSize === "auto") {
      // Page matches the image exactly: no letterboxing, no cropping.
      const page = document.addPage([width, height]);
      page.drawImage(embedded, { x: 0, y: 0, width, height });
      continue;
    }

    const [pageWidth, pageHeight] = PAGE_SIZES[options.pageSize] ?? PAGE_SIZES.a4;
    const page = document.addPage([pageWidth, pageHeight]);

    // Fit inside the margins while preserving the aspect ratio.
    const available = {
      width: pageWidth - options.margin * 2,
      height: pageHeight - options.margin * 2,
    };
    const scale = Math.min(available.width / width, available.height / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;

    page.drawImage(embedded, {
      x: (pageWidth - drawWidth) / 2,
      y: (pageHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  context.report({ stage: "Saving", ratio: 1 });

  return {
    outputs: [
      {
        filename: "images.pdf",
        blob: new Blob([new Uint8Array(await document.save())], {
          type: "application/pdf",
        }),
      },
    ],
  };
}

interface NormalizedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  isPng: boolean;
}

/**
 * pdf-lib embeds only JPEG and PNG. Anything else (WebP, GIF, BMP) is decoded
 * and re-encoded as PNG so the user never has to think about formats.
 */
async function normalizeImage(file: File): Promise<NormalizedImage> {
  const type = file.type.toLowerCase();
  const isJpeg = type === "image/jpeg" || type === "image/jpg";
  const isPng = type === "image/png";

  if (isJpeg || isPng) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const size = await readImageSize(file);
    return { bytes, width: size.width, height: size.height, isPng };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ToolError(
      "UNSUPPORTED_FILE",
      `We couldn't read ${file.name}. Try a JPG or PNG instead.`,
    );
  }

  const canvas = requireOffscreenCanvas(bitmap.width, bitmap.height);
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw new ToolError("UNKNOWN");

  // White background: transparent regions would otherwise render black.
  canvasContext.fillStyle = "#ffffff";
  canvasContext.fillRect(0, 0, bitmap.width, bitmap.height);
  canvasContext.drawImage(bitmap, 0, 0);

  const blob = await canvas.convertToBlob({ type: "image/png" });
  bitmap.close();

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: canvas.width,
    height: canvas.height,
    isPng: true,
  };
}

async function readImageSize(file: File): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    throw new ToolError(
      "UNSUPPORTED_FILE",
      `We couldn't read ${file.name}. The file may be damaged.`,
    );
  }
}

/* ---------------- PDF → Images ---------------- */

interface PdfToImageOptions {
  format: "jpeg" | "png";
  /** Render scale relative to the PDF's natural size. 2 ≈ 150 DPI. */
  scale: number;
  quality: number;
}

export async function pdfToImages(
  file: File,
  options: PdfToImageOptions,
  context: OperationContext,
): Promise<OperationResult> {
  // pdf.js is the heaviest dependency in the project, so it is imported here
  // rather than at module scope.
  const pdfjs = await import("pdfjs-dist");

  // The worker already runs off the main thread; disabling pdf.js's own worker
  // avoids nesting a second one, which browsers do not universally support.
  pdfjs.GlobalWorkerOptions.workerSrc = "";

  let pdf;
  try {
    pdf = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") throw new ToolError("PASSWORD_REQUIRED");
    throw new ToolError("CORRUPT_FILE");
  }

  const base = stripExtension(file.name);
  const extension = options.format === "png" ? "png" : "jpg";
  const outputs: ToolOutput[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    context.throwIfCancelled();
    context.report({
      stage: `Rendering page ${pageNumber} of ${pdf.numPages}`,
      ratio: (pageNumber - 1) / pdf.numPages,
    });

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: options.scale });

    const canvas = requireOffscreenCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );
    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) throw new ToolError("UNKNOWN");

    // JPEG has no alpha channel, so fill white before painting the page.
    if (options.format === "jpeg") {
      canvasContext.fillStyle = "#ffffff";
      canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvasContext: canvasContext as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    const blob = await canvas.convertToBlob({
      type: `image/${options.format}`,
      quality: options.quality,
    });

    outputs.push({
      filename: `${base}-page-${pageNumber}.${extension}`,
      blob,
    });

    page.cleanup();
  }

  await pdf.destroy();

  return { outputs };
}

/* ---------------- Dispatch ---------------- */

export async function runImageOperation(
  op: "pdf-to-image" | "images-to-pdf",
  files: File[],
  options: Record<string, unknown>,
  context: OperationContext,
): Promise<OperationResult> {
  if (op === "images-to-pdf") {
    return imagesToPdf(
      files,
      {
        pageSize: (options.pageSize as string) ?? "auto",
        margin: (options.margin as number) ?? 36,
      },
      context,
    );
  }

  return pdfToImages(
    files[0],
    {
      format: (options.format as "jpeg" | "png") ?? "jpeg",
      scale: (options.scale as number) ?? 2,
      quality: (options.quality as number) ?? 0.92,
    },
    context,
  );
}
