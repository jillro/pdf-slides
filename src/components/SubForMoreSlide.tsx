"use client";

import useImage from "use-image";
import logoUrl from "../assets/logo.svg";
import { useEffect, useRef } from "react";
import type Konva from "konva";
import { Image as KImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";
import { Blur } from "konva/lib/filters/Blur";

export default function SubForMoreSlide(props: {
  img?: HTMLImageElement;
  imgX: number;
  numero: number;
  scale: number;
  width: number;
  ref: React.Ref<Konva.Stage>;
  display: boolean;
}) {
  const [logo] = useImage(logoUrl.src, "anonymous");

  const imgRef = useRef<Konva.Image>(null);
  const contentRef = useRef<Konva.Text>(null);

  useEffect(() => {
    imgRef.current?.cache();
  }, [props.img]);

  return (
    <Stage
      scaleX={props.scale}
      scaleY={props.scale}
      width={props.width}
      height={props.width ? (props.width * 1350) / 1080 : 0}
      ref={props.ref}
      style={{ display: props.display ? "block" : "none" }}
    >
      <Layer background={"white"}>
        {props.img && (
          <BackgroundImage
            image={props.img}
            x={props.imgX}
            filters={[Blur]}
            blurRadius={100}
            ref={imgRef}
          />
        )}
        <Rect
          x={0}
          y={0}
          width={1080}
          height={1350}
          fill="rgba(17,17,17,0.61)"
        />

        <Text
          text={`La suite de cet article est à retrouver dans notre N°${props.numero}`}
          x={150}
          y={200}
          align={"center"}
          ref={contentRef}
          width={1080 - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={82}
          fontStyle={"normal"}
          fontFamily={"Atkinson Hyperlegible"}
        />

        <Text
          text={"ou"}
          x={150}
          y={530}
          align={"center"}
          ref={contentRef}
          width={1080 - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={72}
          fontStyle={"normal"}
          fontFamily={"Atkinson Hyperlegible"}
        />

        <Line points={[150, 565, 450, 565]} stroke={"white"} />
        <Line points={[1080 - 150, 565, 1080 - 450, 565]} stroke={"white"} />

        <Text
          text={"sur"}
          x={150}
          y={680}
          align={"center"}
          ref={contentRef}
          width={1080 - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={72}
          fontStyle={"normal"}
          fontFamily={"Atkinson Hyperlegible"}
        />
        <Text
          text={"partidesfemmes.fr"}
          x={150}
          y={760}
          align={"center"}
          ref={contentRef}
          width={1080 - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={72}
          fontStyle={"bold"}
          fontFamily={"Atkinson Hyperlegible"}
        />
        <KImage image={logo} x={(1080 - 90) / 2} y={950} width={90} />
        <Text
          text={"Soutiens la presse féministe et indépendante !"}
          x={200}
          y={1060}
          align={"center"}
          ref={contentRef}
          width={1080 - 200 * 2}
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
          y={1180}
          align={"center"}
          ref={contentRef}
          width={1080 - 200 * 2}
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
