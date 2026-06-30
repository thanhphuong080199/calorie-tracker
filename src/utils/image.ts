import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

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
