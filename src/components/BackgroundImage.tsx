"use client";

import { Image as KImage } from "react-konva";

export default function BackgroundImage(
  props: React.ComponentProps<typeof KImage> & {
    image: HTMLImageElement;
    x: number;
    canvasWidth: number;
    canvasHeight: number;
    onCoordinateChange?: (x: number) => void;
  },
) {
  const imgScale =
    props.image.width / props.image.height >
    props.canvasWidth / props.canvasHeight
      ? props.canvasHeight / props.image.height
      : props.canvasWidth / props.image.width;

  return (
    <KImage
      x={props.x ?? 0}
      y={0}
      scaleY={imgScale}
      scaleX={imgScale}
      draggable
      onDragMove={(e) => {
        const x = Math.max(
          Math.min(e.target.x() + e.evt.movementX, 0),
          props.canvasWidth - props.image.width * imgScale,
        );
        e.target.x(x);
        e.target.y(
          Math.max(
            Math.min(e.target.y() + e.evt.movementY, 0),
            props.canvasHeight - props.image.height * imgScale,
          ),
        );
      }}
      onDragEnd={(e) => {
        const x = Math.max(
          Math.min(e.target.x() + e.evt.movementX, 0),
          props.canvasWidth - props.image.width * imgScale,
        );
        props.onCoordinateChange?.(isNaN(x) ? 0 : x);
      }}
      {...props}
    />
  );
}
