"use client";

import { Image as KImage } from "react-konva";

export default function BackgroundImage({
  image,
  x,
  canvasWidth,
  canvasHeight,
  onCoordinateChange,
}: {
  image: HTMLImageElement;
  x: number;
  canvasWidth: number;
  canvasHeight: number;
  onCoordinateChange?: (x: number) => void;
}) {
  const imgScale =
    image.width / image.height > canvasWidth / canvasHeight
      ? canvasHeight / image.height
      : canvasWidth / image.width;

  return (
    <KImage
      image={image}
      x={x ?? 0}
      y={0}
      scaleY={imgScale}
      scaleX={imgScale}
      draggable
      onTouchStart={(e) => {
        e.evt.preventDefault();
      }}
      onDragMove={(e) => {
        const newX = Math.max(
          Math.min(e.target.x(), 0),
          canvasWidth - image.width * imgScale,
        );
        e.target.x(newX);
        e.target.y(
          Math.max(
            Math.min(e.target.y(), 0),
            canvasHeight - image.height * imgScale,
          ),
        );
      }}
      onDragEnd={(e) => {
        const newX = Math.max(
          Math.min(e.target.x(), 0),
          canvasWidth - image.width * imgScale,
        );
        onCoordinateChange?.(isNaN(newX) ? 0 : newX);
      }}
    />
  );
}
