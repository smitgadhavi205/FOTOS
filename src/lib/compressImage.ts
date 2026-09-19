/**
 * Compress and resize an image file in the browser before upload.
 * Keeps photos under ~2000px on the longest side and re-encodes as JPEG
 * (or PNG/WebP if the original had transparency), drastically reducing
 * storage usage with no visible quality loss on screen.
 */
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;

export async function compressImage(file: File): Promise<{ blob: Blob; extension: string }> {
  // Skip non-raster or already-tiny files
  if (!file.type.startsWith("image/") || file.size < 200 * 1024) {
    return { blob: file, extension: file.name.split(".").pop() || "jpg" };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas context");

    const hasAlpha = file.type === "image/png" || file.type === "image/webp";
    if (!hasAlpha) {
      // Flatten onto white so transparent-ish edges don't go black in JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const mime = hasAlpha ? file.type : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, mime, JPEG_QUALITY)
    );
    if (!blob) throw new Error("encode failed");

    // If compression somehow made it bigger, keep the original
    if (blob.size >= file.size) {
      return { blob: file, extension: file.name.split(".").pop() || "jpg" };
    }
    return { blob, extension: hasAlpha ? (file.name.split(".").pop() || "png") : "jpg" };
  } catch {
    // Any failure: fall back to the untouched original
    return { blob: file, extension: file.name.split(".").pop() || "jpg" };
  }
}
