/**
 * Creates a blurred version of an image using Canvas 2D filter.
 * This pre-generates the blur so Konva doesn't need to apply it dynamically.
 */
export function createBlurredImage(
  img: HTMLImageElement,
  blurRadius: number = 100,
): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(img, 0, 0);

    const blurredImg = new Image();
    blurredImg.onload = () => resolve(blurredImg);
    blurredImg.src = canvas.toDataURL();
  });
}
