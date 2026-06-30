import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File, Directory, Paths } from "expo-file-system";

/**
 * Resize + JPEG-compress a local image and return its base64 payload, keeping
 * the request to Gemini small. Uses the SDK 54 contextual manipulator API.
 */
export async function toResizedBase64(
  uri: string,
  maxWidth = 1024,
): Promise<string> {
  const context = ImageManipulator.manipulate(uri).resize({ width: maxWidth });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    base64: true,
    compress: 0.6,
    format: SaveFormat.JPEG,
  });
  if (!result.base64) throw new Error("Couldn't process the image.");
  return result.base64;
}

/** Persistent directory for meal thumbnails (survives OS cache purges). */
const THUMB_DIR = new Directory(Paths.document, "thumbs");

/**
 * Generate a small (~200px) thumbnail of `uri` and persist it to the document
 * directory as `{id}.jpg`. Returns the persistent file URI. We keep only this
 * thumbnail — never the full-res original — so the on-disk footprint stays at
 * ~15 KB/meal and the reference can't be invalidated by a cache purge.
 */
export async function saveThumbnail(uri: string, id: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri).resize({ width: 200 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG });

  if (!THUMB_DIR.exists) THUMB_DIR.create({ idempotent: true });

  const dest = new File(THUMB_DIR, `${id}.jpg`);
  if (dest.exists) dest.delete();

  // saveAsync writes to a temp cache file; move it into the persistent dir.
  new File(result.uri).move(dest);
  return dest.uri;
}

/** Best-effort delete of a persisted thumbnail. No-op when the uri is missing. */
export function deleteThumbnail(uri?: string): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // best-effort cleanup — a leftover thumbnail is harmless
  }
}
