"use client";

import { Rect } from "react-konva";

export default function Gradient(props: {
  position: "top" | "bottom";
  height: number;
}) {
  const { position, height } = props;

  return (
    <Rect
      x={0}
      y={position === "top" ? 0 : 1350 - height}
      width={1080}
      height={height}
      fillLinearGradientStartPoint={{
        x: 0,
        y: position === "top" ? 0 : height,
      }}
      fillLinearGradientEndPoint={{ x: 0, y: position === "top" ? height : 0 }}
      fillLinearGradientColorStops={[
        0,
        "rgba(0,0,0,1)",
        0.5,
        "rgba(0,0,0,1)",
        0.7,
        "rgba(0,0,0,0.9)",
        0.75,
        "rgba(0,0,0,0.8)",
        0.85,
        "rgba(0,0,0,0.4)",
        0.95,
        "rgba(0,0,0,0.1)",
        1,
        "rgba(0,0,0,0)",
      ]}
    />
  );
}
