// Stores and reads book photos on disk (see src/lib/uploads.ts for where).
// Every photo is re-encoded here: resized, converted to WebP and stripped of all metadata,
// EXIF and GPS included, before it touches the disk.
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { bookImageUrl, IMAGE_MAX_EDGE, isImageFileName, unusedImages } from "@/lib/domain/book-images";
import { bookUploadDir, listBookFiles } from "@/lib/uploads";

// Largest upload accepted before decoding. The browser already shrinks photos, so a real
// photo is far below this; it only stops abuse.
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// A photo uploaded less than this long ago is never cleaned up, even if no page uses it yet.
const UNUSED_GRACE_MS = 60 * 60 * 1000;

export class InvalidImageError extends Error {}

export async function storeBookImage(bookId: string, input: Buffer): Promise<string> {
  let output: Buffer;
  try {
    output = await sharp(input, { limitInputPixels: 50_000_000 })
      // Apply the EXIF orientation to the pixels, since the metadata is dropped below.
      .rotate()
      .resize({ width: IMAGE_MAX_EDGE, height: IMAGE_MAX_EDGE, fit: "inside", withoutEnlargement: true })
      // sharp writes no metadata unless asked to (withMetadata), so EXIF and GPS are gone.
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new InvalidImageError("This file is not an image we can read.");
  }

  const dir = bookUploadDir(bookId);
  await mkdir(dir, { recursive: true });
  const fileName = `${crypto.randomUUID()}.webp`;
  await writeFile(path.join(dir, fileName), output);
  return bookImageUrl(bookId, fileName);
}

// Null when the name is not one we create or the file does not exist.
export async function readBookImage(bookId: string, fileName: string): Promise<Buffer | null> {
  if (!isImageFileName(fileName)) return null;
  try {
    return await readFile(path.join(bookUploadDir(bookId), fileName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

// Deletes the photos of a book that no page or cover uses anymore (replaced or removed).
export async function deleteUnusedImages(bookId: string, usedUrls: (string | null)[]): Promise<void> {
  const dir = bookUploadDir(bookId);
  const files = await Promise.all(
    (await listBookFiles(bookId)).map(async (file) => ({
      name: file.name,
      modifiedAt: (await stat(path.join(dir, file.name))).mtime,
    })),
  );
  const unused = unusedImages(files, usedUrls, bookId, new Date(), UNUSED_GRACE_MS);
  await Promise.all(unused.map((name) => rm(path.join(dir, name), { force: true })));
}
