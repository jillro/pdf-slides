"use client";

import useImage from "use-image";
import logoUrl from "../assets/logo.svg";
import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Image as KImage, Layer, Rect, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";

export default function ContentSlide(props: {
  img?: HTMLImageElement;
  rubrique: string;
  content: string;
  scale: number;
  width: number;
  ref: React.Ref<Konva.Stage>;
  display: boolean;
  last?: boolean;
}) {
  const [logo] = useImage(logoUrl.src, "anonymous");
  const [rubriqueWidth, setRubriqueWidth] = useState<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(64);

  const imgRef = useRef<Konva.Image>(null);
  const rubriqueRef = useRef<Konva.Text>(null);
  const contentRef = useRef<Konva.Text>(null);

  useEffect(() => {
    imgRef.current?.cache();
  }, [props.img]);

  useEffect(() => {
    setRubriqueWidth(rubriqueRef.current?.width() || 0);
  }, [props.rubrique]);

  useEffect(() => {
    setContentHeight(contentRef.current?.height() || 0);
  }, [fontSize, props.content]);

  useEffect(() => {
    if ((contentRef.current?.height() || 0) > 1050) {
      setFontSize(Math.min(64, fontSize - 1));
    }

    if ((contentRef.current?.height() || 0) < 950) {
      setFontSize(Math.min(64, fontSize + 1));
    }
  }, [contentHeight, fontSize]);

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
            filters={[Konva.Filters.Blur]}
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
        <KImage image={logo} x={1080 - 150 - rubriqueWidth} y={37} width={60} />
        <Text
          text={props.rubrique}
          x={1080 - 60 - rubriqueWidth}
          y={60}
          ref={rubriqueRef}
          fill={"#ffd9af"}
          wrap={"word"}
          fontSize={(60 / 80) * 64}
          fontFamily={"Rubik"}
        />

        <Text
          text={props.content}
          x={150}
          y={(1350 - contentHeight) / 2}
          ref={contentRef}
          width={1080 - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={fontSize}
          fontFamily={"Atkinson Hyperlegible"}
        />

        {!props.last ? (
          <Text
            text=">"
            x={1080 - 150}
            y={1143}
            width={1080 - 150 * 2}
            fill={"#ffd9af"}
            wrap={"word"}
            fontSize={108}
            fontFamily={"Rubik"}
            fontVariant={"bold"}
          />
        ) : null}
      </Layer>
    </Stage>
  );
}
