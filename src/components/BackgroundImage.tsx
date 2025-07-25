"use client";

import { Image as KImage } from "react-konva";

export default function BackgroundImage(
  props: React.ComponentProps<typeof KImage> & { image: HTMLImageElement },
) {
  const imgScale =
    props.image.width / props.image.height > 1080 / 1350
      ? 1350 / props.image.height
      : 1080 / props.image.width;

  return (
    <KImage
      x={0}
      y={0}
      scaleY={imgScale}
      scaleX={imgScale}
      draggable
      onDragMove={(e) => {
        e.target.x(
          Math.max(
            Math.min(e.target.x() + e.evt.movementX, 0),
            1080 - props.image.width * imgScale,
          ),
        );
        e.target.y(
          Math.max(
            Math.min(e.target.y() + e.evt.movementY, 0),
            1350 - props.image.height * imgScale,
          ),
        );
      }}
      {...props}
    />
  );
}
