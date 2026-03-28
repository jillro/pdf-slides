"use client";

import { useState, useEffect } from "react";

// Inline the SVG as a base64 data URL to avoid:
// 1. Network/CORS issues on Firefox mobile
// 2. use-image's img.decode() hanging on Firefox mobile for SVGs
const LOGO_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9Ijk2IiB2aWV3Qm94PSIwIDAgMTI4IDk2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTY2LjgwNSAzMS42NTQyTDkzLjEyMjIgMEw5OC44OTEyIDQuNzk2MzZMNzcuOTg0NSAyOS45NDI4TDExMC43NTQgMTQuNTcxNEwxMTcuNjIyIDI5LjIxMjVMMTA5Ljc0MyAzMi45MDg1QzEwOC4zNjkgMzMuNDQ4MyAxMDIuMjg2IDM1LjU1OSA5My4wMDIzIDM0LjcxNUM4OC45MTIzIDM0LjM0MzEgNzQuMDkxOCAzMi41NTYgNjYuODA1IDMxLjY1NDJaTTEwLjYzMTkgNzkuMzk4NkwzNy42NDUzIDY2LjcyNzNMMzcuNjM2MSA2Ni43Mzg0TDUwLjEyMzkgNjAuNzk3M0w1NS43MzAyIDYxLjYzNjlMNTUuNzE5MSA2MS42NDE4TDEyMy4zMzcgNzEuNzc0MkwxMjcuODUyIDQxLjY0NkwxMDAuNzgxIDM3LjU4OTRMMTAwLjc3OCAzNy41OTA4TDc4Ljg4NzggMzQuMzA4OEw0LjUxNDY0IDIzLjE2NDJMMCA1My4yOTI0TDIxLjM3NzMgNTYuNDk1N0wzLjc2NDIxIDY0Ljc1NzZMMTAuNjMxOSA3OS4zOTg2Wk01MC40NTc5IDYzLjA1MThDNDguNjkzNCA2My40MTk5IDQ2LjIxMzkgNjQuMDQ5NCA0My42MTUyIDY1LjA2NTZDNDIuMjY3NiA2NS41OTI2IDM4Ljk4ODMgNjcuMDgyNiAzNi4zMzI4IDY4LjMwNjFMMTcuNTcxOCA5MC44NzE3TDIzLjM0MDggOTUuNjY4MUw1MC40NTc5IDYzLjA1MThaIiBmaWxsPSIjRkZEOUFGIi8+Cjwvc3ZnPgo=";

// SVG natural size is 128x96. Rasterize at 2x for crisp rendering.
const RASTER_WIDTH = 256;
const RASTER_HEIGHT = 192;

/**
 * Loads the logo and rasterizes it to a PNG-backed HTMLImageElement.
 * Bypasses use-image to avoid img.decode() hanging on Firefox mobile,
 * and uses an inline data URL to avoid CORS/network issues.
 * Rasterizing to PNG avoids Firefox's SVG-to-canvas bug during Konva export.
 */
export function useLogoImage(): [HTMLImageElement | undefined] {
  const [rasterImage, setRasterImage] = useState<HTMLImageElement>();

  useEffect(() => {
    const svgImg = new Image();
    svgImg.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = RASTER_WIDTH;
        canvas.height = RASTER_HEIGHT;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(svgImg, 0, 0, RASTER_WIDTH, RASTER_HEIGHT);

        const pngImg = new Image();
        pngImg.onload = () => setRasterImage(pngImg);
        pngImg.src = canvas.toDataURL("image/png");
      } catch {
        // If rasterization fails, fall back to the SVG image directly
        setRasterImage(svgImg);
      }
    };
    svgImg.src = LOGO_DATA_URL;
  }, []);

  return [rasterImage];
}
