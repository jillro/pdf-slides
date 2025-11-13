/**
 * Calculate the average luminosity of an image or a specific region of it.
 * Uses the relative luminance formula from WCAG 2.0
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 *
 * Returns a value between 0 (dark) and 1 (light)
 *
 * @param img - The image element to sample
 * @param region - Which region to sample: "top" (top 40%), "bottom" (bottom 40%), or "middle" (full image)
 */
export function getImageLuminosity(
  img: HTMLImageElement,
  region: "top" | "bottom" | "middle" = "middle",
): number {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(img.width, 100); // Sample at lower resolution for performance
  canvas.height = Math.min(img.height, 100);

  const ctx = canvas.getContext("2d");
  if (!ctx) return 0.5; // Default to middle if canvas unavailable

  // Calculate source region based on which part of the image to sample
  let srcY = 0;
  let srcHeight = img.height;

  if (region === "top") {
    // Sample top 40% of the image
    srcHeight = img.height * 0.4;
    srcY = 0;
  } else if (region === "bottom") {
    // Sample bottom 40% of the image
    srcHeight = img.height * 0.4;
    srcY = img.height - srcHeight;
  }
  // else "middle": sample entire image (srcY=0, srcHeight=img.height)

  ctx.drawImage(
    img,
    0,
    srcY,
    img.width,
    srcHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let sum = 0;
  let count = 0;

  // Sample every 4th pixel to reduce computation
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip transparent pixels
    if (a < 128) continue;

    // Convert sRGB to linear RGB
    const rLinear = r / 255;
    const gLinear = g / 255;
    const bLinear = b / 255;

    const r2 =
      rLinear <= 0.03928
        ? rLinear / 12.92
        : Math.pow((rLinear + 0.055) / 1.055, 2.4);
    const g2 =
      gLinear <= 0.03928
        ? gLinear / 12.92
        : Math.pow((gLinear + 0.055) / 1.055, 2.4);
    const b2 =
      bLinear <= 0.03928
        ? bLinear / 12.92
        : Math.pow((bLinear + 0.055) / 1.055, 2.4);

    // WCAG relative luminance formula
    const luminance = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
    sum += luminance;
    count++;
  }

  return count > 0 ? sum / count : 0.5;
}

/**
 * Calculate overlay opacity based on image luminosity.
 * Light images (high luminosity) get higher opacity overlays to darken them.
 * Dark images (low luminosity) get lower opacity overlays.
 *
 * @param luminosity - Value between 0 (dark) and 1 (light)
 * @param minOpacity - Minimum opacity for dark images (default: 0.2)
 * @param maxOpacity - Maximum opacity for light images (default: 0.8)
 * @returns Opacity value between minOpacity and maxOpacity
 */
export function calculateOverlayOpacity(
  luminosity: number,
  minOpacity: number = 0.5,
  maxOpacity: number = 0.8,
): number {
  // Clamp luminosity to 0-1 range
  const normalizedLuminosity = Math.max(0, Math.min(1, luminosity));

  // Linear interpolation: dark images get low opacity, light images get high opacity
  return minOpacity + normalizedLuminosity * (maxOpacity - minOpacity);
}
