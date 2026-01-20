"use client";

import { Rect } from "react-konva";

export default function Gradient(props: {
  position: "top" | "bottom";
  height: number;
  maxOpacity?: number; // Scale gradient opacity (0-1)
  canvasHeight: number;
}) {
  const { position, height, maxOpacity = 1, canvasHeight } = props;

  // Helper to create rgba with scaled opacity
  const rgba = (opacity: number) => `rgba(0,0,0,${opacity * maxOpacity})`;

  return (
    <Rect
      x={0}
      y={position === "top" ? 0 : canvasHeight - height}
      width={1080}
      height={height}
      fillLinearGradientStartPoint={{
        x: 0,
        y: position === "top" ? 0 : height,
      }}
      fillLinearGradientEndPoint={{ x: 0, y: position === "top" ? height : 0 }}
      fillLinearGradientColorStops={[
        0,
        rgba(1),
        0.5,
        rgba(1),
        0.7,
        rgba(0.9),
        0.75,
        rgba(0.8),
        0.85,
        rgba(0.4),
        0.95,
        rgba(0.1),
        1,
        "rgba(0,0,0,0)",
      ]}
    />
  );
}
