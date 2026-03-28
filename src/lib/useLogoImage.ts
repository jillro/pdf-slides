"use client";

import { useState, useEffect } from "react";
import useImage from "use-image";
import logoUrl from "../assets/logo.svg";

// SVG natural size is 128x96. Rasterize at 2x for crisp rendering
// since the logo is displayed at up to 90px wide in slides.
const RASTER_WIDTH = 256;
const RASTER_HEIGHT = 192;

/**
 * Loads the logo SVG and rasterizes it to a PNG-backed HTMLImageElement.
 * This works around a Firefox mobile bug where SVG images silently fail
 * to render when drawn to canvas during Konva's toBlob() export.
 */
export function useLogoImage(): [HTMLImageElement | undefined] {
  const [svgImage] = useImage(logoUrl.src, "anonymous");
  const [rasterImage, setRasterImage] = useState<HTMLImageElement>();

  useEffect(() => {
    if (!svgImage) return;

    const canvas = document.createElement("canvas");
    canvas.width = RASTER_WIDTH;
    canvas.height = RASTER_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(svgImage, 0, 0, RASTER_WIDTH, RASTER_HEIGHT);

    const img = new Image();
    img.onload = () => setRasterImage(img);
    img.src = canvas.toDataURL("image/png");
  }, [svgImage]);

  return [rasterImage];
}
