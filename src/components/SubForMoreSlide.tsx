"use client";

import { useLogoImage } from "../lib/useLogoImage";
import { useRef } from "react";
import type Konva from "konva";
import { Image as KImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";
import { NEAR_WHITE, ACCENT, OVERLAY_COLOR } from "../lib/colors";

export default function SubForMoreSlide(props: {
  backgroundImg?: HTMLImageElement; // Pre-blurred image for background
  overlayOpacity: number;
  imgX: number;
  numero: number;
  scale: number;
  width: number;
  canvasWidth: number;
  canvasHeight: number;
  ref: React.Ref<Konva.Stage>;
  display: boolean;
}) {
  const [logo] = useLogoImage();

  const contentRef = useRef<Konva.Text>(null);

  // Calculate vertical offset to center content in story format
  // Original content spans from y=200 to y=1180 in 1350px canvas (980px height)
  // Center this content block within the canvas
  const contentBlockHeight = 980;
  const yOffset = (props.canvasHeight - contentBlockHeight) / 2 - 200;

  return (
    <Stage
      scaleX={props.scale}
      scaleY={props.scale}
      width={props.width}
      height={
        props.width ? (props.width * props.canvasHeight) / props.canvasWidth : 0
      }
      ref={props.ref}
      style={{ display: props.display ? "block" : "none" }}
    >
      <Layer background={"white"}>
        {props.backgroundImg && (
          <BackgroundImage
            image={props.backgroundImg}
            x={props.imgX}
            canvasWidth={props.canvasWidth}
            canvasHeight={props.canvasHeight}
          />
        )}
        <Rect
          x={0}
          y={0}
          width={props.canvasWidth}
          height={props.canvasHeight}
          fill={`rgba(${OVERLAY_COLOR},${props.overlayOpacity})`}
        />

        <Text
          text={`La suite de cet article est à retrouver dans notre N°${props.numero}`}
          x={150}
          y={200 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={NEAR_WHITE}
          wrap={"word"}
          fontSize={82}
          fontStyle={"500"}
          fontFamily={"Atkinson Hyperlegible Next"}
          lineHeight={1.1}
          letterSpacing={-1.5}
        />

        <Text
          text={"ou"}
          x={150}
          y={530 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={NEAR_WHITE}
          wrap={"word"}
          fontSize={72}
          fontStyle={"500"}
          fontFamily={"Atkinson Hyperlegible Next"}
          letterSpacing={-1}
        />

        <Line
          points={[150, 565 + yOffset, 450, 565 + yOffset]}
          stroke={NEAR_WHITE}
        />
        <Line
          points={[
            props.canvasWidth - 150,
            565 + yOffset,
            props.canvasWidth - 450,
            565 + yOffset,
          ]}
          stroke={NEAR_WHITE}
        />

        <Text
          text={"sur"}
          x={150}
          y={680 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={NEAR_WHITE}
          wrap={"word"}
          fontSize={72}
          fontStyle={"500"}
          fontFamily={"Atkinson Hyperlegible Next"}
          letterSpacing={-1}
        />
        <Text
          text={"partidesfemmes.fr"}
          x={150}
          y={760 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={NEAR_WHITE}
          wrap={"word"}
          fontSize={72}
          fontStyle={"bold"}
          fontFamily={"Atkinson Hyperlegible Next"}
          letterSpacing={-1}
        />
        <KImage
          image={logo}
          x={(props.canvasWidth - 90) / 2}
          y={950 + yOffset}
          width={90}
          height={67.5}
        />
        <Text
          text={"Soutiens la presse féministe et indépendante !"}
          x={200}
          y={1060 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 200 * 2}
          fill={ACCENT}
          lineHeight={1.1}
          wrap={"word"}
          fontSize={50}
          fontStyle={"500"}
          fontFamily={"Atkinson Hyperlegible Next"}
          letterSpacing={0.5}
        />
        <Text
          text={"Abonne-toi !"}
          x={200}
          y={1180 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 200 * 2}
          fill={ACCENT}
          wrap={"word"}
          fontSize={50}
          fontStyle={"bold"}
          fontFamily={"Atkinson Hyperlegible Next"}
          letterSpacing={0.5}
        />
      </Layer>
    </Stage>
  );
}
