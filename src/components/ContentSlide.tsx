"use client";

import useImage from "use-image";
import logoUrl from "../assets/logo.svg";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Image as KImage, Layer, Rect, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";
import { Blur } from "konva/lib/filters/Blur";
import { getImageLuminosity, calculateOverlayOpacity } from "../lib/luminosity";

export default function ContentSlide(props: {
  img?: HTMLImageElement;
  imgX: number;
  rubrique: string;
  content: string;
  scale: number;
  width: number;
  canvasWidth: number;
  canvasHeight: number;
  ref: React.Ref<Konva.Stage>;
  display: boolean;
  last?: boolean;
}) {
  const [logo] = useImage(logoUrl.src, "anonymous");
  const [rubriqueWidth, setRubriqueWidth] = useState<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(58);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.61);

  const imgRef = useRef<Konva.Image>(null);
  const rubriqueRef = useRef<Konva.Text>(null);
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

  useEffect(() => {
    setRubriqueWidth(rubriqueRef.current?.width() || 0);
  }, [props.rubrique]);

  useEffect(() => {
    setContentHeight(contentRef.current?.height() || 0);
  }, [fontSize, props.content]);

  useEffect(() => {
    const maxContentHeight = props.canvasHeight * 0.74;
    const minContentHeight = props.canvasHeight * 0.67;

    if ((contentRef.current?.height() || 0) > maxContentHeight) {
      setFontSize(Math.min(58, fontSize - 1));
    }

    if ((contentRef.current?.height() || 0) < minContentHeight) {
      setFontSize(Math.min(58, fontSize + 1));
    }
  }, [contentHeight, fontSize, props.canvasHeight]);

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
            filters={[Blur]}
            blurRadius={100}
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
        <KImage
          image={logo}
          x={props.canvasWidth - 150 - rubriqueWidth}
          y={37}
          width={60}
        />
        <Text
          text={props.rubrique}
          x={props.canvasWidth - 60 - rubriqueWidth}
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
          y={(props.canvasHeight - contentHeight) / 2}
          ref={contentRef}
          width={props.canvasWidth - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={fontSize}
          fontFamily={"Atkinson Hyperlegible"}
        />

        {!props.last ? (
          <Text
            text=">"
            x={props.canvasWidth - 150}
            y={props.canvasHeight - 207}
            width={props.canvasWidth - 150 * 2}
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
