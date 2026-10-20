// Uploaded images live on the server's disk, not in the database and not in a bucket.
// Layout: <UPLOAD_DIR>/books/<book id>/<file>. Each book owns one folder, so measuring a
// book, a user or the whole project is a matter of adding up file sizes.
// In production UPLOAD_DIR must be a mounted volume, or the files vanish on every deploy.
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

export function bookUploadDir(bookId: string): string {
  return path.join(UPLOAD_DIR, "books", bookId);
}

export type UploadedFile = { name: string; bytes: number };
export type DirUsage = { files: number; bytes: number };

// The files directly inside a book's folder. A folder that does not exist yet means no uploads.
export async function listBookFiles(bookId: string): Promise<UploadedFile[]> {
  const dir = bookUploadDir(bookId);
  const entries = await readdirOrEmpty(dir);
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => ({ name: entry.name, bytes: (await stat(path.join(dir, entry.name))).size })),
  );
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export async function bookUsage(bookId: string): Promise<DirUsage> {
  return measureDir(bookUploadDir(bookId));
}

// Everything under UPLOAD_DIR, including folders of books that were deleted (orphans).
export async function totalUsage(): Promise<DirUsage> {
  return measureDir(UPLOAD_DIR);
}

async function measureDir(dir: string): Promise<DirUsage> {
  const usage: DirUsage = { files: 0, bytes: 0 };
  for (const entry of await readdirOrEmpty(dir)) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = await measureDir(full);
      usage.files += inner.files;
      usage.bytes += inner.bytes;
    } else if (entry.isFile()) {
      usage.files += 1;
      usage.bytes += (await stat(full)).size;
    }
  }
  return usage;
}

async function readdirOrEmpty(dir: string) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
