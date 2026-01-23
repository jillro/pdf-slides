"use client";

import useImage from "use-image";
import logoUrl from "../assets/logo.svg";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Image as KImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";
import { Blur } from "konva/lib/filters/Blur";
import { getImageLuminosity, calculateOverlayOpacity } from "../lib/luminosity";

export default function SubForMoreSlide(props: {
  img?: HTMLImageElement;
  imgX: number;
  numero: number;
  scale: number;
  width: number;
  canvasWidth: number;
  canvasHeight: number;
  ref: React.Ref<Konva.Stage>;
  display: boolean;
  previewMode?: boolean;
}) {
  const [logo] = useImage(logoUrl.src, "anonymous");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.61);

  const imgRef = useRef<Konva.Image>(null);
  const contentRef = useRef<Konva.Text>(null);

  useEffect(() => {
    imgRef.current?.cache();
    if (props.img) {
      const luminosity = getImageLuminosity(props.img);
      const opacity = calculateOverlayOpacity(luminosity, 0.5, 0.8);
      setOverlayOpacity(opacity);
    } else {
      setOverlayOpacity(0.61); // Default opacity when no image
    }
  }, [props.img]);

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
        {props.img && (
          <BackgroundImage
            image={props.img}
            x={props.imgX}
            canvasWidth={props.canvasWidth}
            canvasHeight={props.canvasHeight}
            filters={props.previewMode ? undefined : [Blur]}
            blurRadius={props.previewMode ? 0 : 100}
            ref={imgRef}
          />
        )}
        <Rect
          x={0}
          y={0}
          width={props.canvasWidth}
          height={props.canvasHeight}
          fill={`rgba(17,17,17,${overlayOpacity})`}
        />

        <Text
          text={`La suite de cet article est à retrouver dans notre N°${props.numero}`}
          x={150}
          y={200 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={82}
          fontStyle={"normal"}
          fontFamily={"Atkinson Hyperlegible"}
        />

        <Text
          text={"ou"}
          x={150}
          y={530 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={72}
          fontStyle={"normal"}
          fontFamily={"Atkinson Hyperlegible"}
        />

        <Line
          points={[150, 565 + yOffset, 450, 565 + yOffset]}
          stroke={"white"}
        />
        <Line
          points={[
            props.canvasWidth - 150,
            565 + yOffset,
            props.canvasWidth - 450,
            565 + yOffset,
          ]}
          stroke={"white"}
        />

        <Text
          text={"sur"}
          x={150}
          y={680 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={72}
          fontStyle={"normal"}
          fontFamily={"Atkinson Hyperlegible"}
        />
        <Text
          text={"partidesfemmes.fr"}
          x={150}
          y={760 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={72}
          fontStyle={"bold"}
          fontFamily={"Atkinson Hyperlegible"}
        />
        <KImage
          image={logo}
          x={(props.canvasWidth - 90) / 2}
          y={950 + yOffset}
          width={90}
        />
        <Text
          text={"Soutiens la presse féministe et indépendante !"}
          x={200}
          y={1060 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 200 * 2}
          fill={"#ffd9af"}
          lineHeight={1.1}
          wrap={"word"}
          fontSize={50}
          fontStyle={"normal"}
          fontFamily={"Atkinson Hyperlegible"}
        />
        <Text
          text={"Abonne-toi !"}
          x={200}
          y={1180 + yOffset}
          align={"center"}
          ref={contentRef}
          width={props.canvasWidth - 200 * 2}
          fill={"#ffd9af"}
          wrap={"word"}
          fontSize={50}
          fontStyle={"bold"}
          fontFamily={"Atkinson Hyperlegible"}
        />
      </Layer>
    </Stage>
  );
}
