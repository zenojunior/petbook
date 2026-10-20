// Browser side of a photo upload. Phone photos are often 5–15 MB, so the browser shrinks them
// before sending. The server re-encodes every photo anyway, so this only saves bandwidth and
// time; it is not a security step.
import { fitWithin, IMAGE_MAX_EDGE } from "@/lib/domain/book-images";

// Files already this small and within the size limit are sent as they are.
const SMALL_ENOUGH_BYTES = 1024 * 1024;

export async function shrinkPhoto(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // A format this browser cannot decode: let the server try, it will say if it cannot.
    return file;
  }
  const size = fitWithin(bitmap.width, bitmap.height, IMAGE_MAX_EDGE);
  if (file.size <= SMALL_ENOUGH_BYTES && size.width === bitmap.width) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  return blob ?? file;
}

export async function uploadPhoto(
  bookId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/")) return { ok: false, error: "Choose an image file." };

  const body = new FormData();
  body.append("file", await shrinkPhoto(file), file.name);
  try {
    const response = await fetch(`/api/books/${bookId}/images`, { method: "POST", body });
    const json: unknown = await response.json();
    if (response.ok && typeof json === "object" && json !== null && "url" in json && typeof json.url === "string") {
      return { ok: true, url: json.url };
    }
    const error =
      typeof json === "object" && json !== null && "error" in json && typeof json.error === "string"
        ? json.error
        : "Could not upload the photo.";
    return { ok: false, error };
  } catch {
    return { ok: false, error: "Could not upload the photo. Check your connection and try again." };
  }
}
