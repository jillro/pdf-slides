"use client";

import useImage from "use-image";
import logoUrl from "../assets/logo.svg";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Image as KImage, Layer, Rect, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";
import { getImageLuminosity, calculateOverlayOpacity } from "../lib/luminosity";

export default function ContentSlide(props: {
  backgroundImg?: HTMLImageElement; // Pre-blurred image for background
  originalImg?: HTMLImageElement; // Original image for luminosity calculation
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
  // Optional external state management for shared measurements
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
}) {
  const {
    originalImg,
    rubrique,
    content,
    canvasHeight,
    fontSize: externalFontSize,
    onFontSizeChange,
  } = props;

  const [logo] = useImage(logoUrl.src, "anonymous");

  const [rubriqueWidth, setRubriqueWidth] = useState<number>(0);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [localFontSize, setLocalFontSize] = useState<number>(58);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.61);

  // Use external fontSize if provided, otherwise use local state
  const fontSize = externalFontSize ?? localFontSize;

  const rubriqueRef = useRef<Konva.Text>(null);
  const contentRef = useRef<Konva.Text>(null);

  // Calculate overlay opacity based on original image luminosity
  useEffect(() => {
    if (originalImg) {
      const luminosity = getImageLuminosity(originalImg);
      const opacity = calculateOverlayOpacity(luminosity, 0.5, 0.8);
      setOverlayOpacity(opacity);
    } else {
      setOverlayOpacity(0.61); // Default opacity when no image
    }
  }, [originalImg]);

  useEffect(() => {
    setRubriqueWidth(rubriqueRef.current?.width() || 0);
  }, [rubrique]);

  useEffect(() => {
    setContentHeight(contentRef.current?.height() || 0);
  }, [fontSize, content]);

  // Only run auto-sizing when external fontSize is not provided
  useEffect(() => {
    if (externalFontSize !== undefined) return;

    const maxContentHeight = canvasHeight * 0.74;
    const minContentHeight = canvasHeight * 0.67;
    const currentHeight = contentRef.current?.height() || 0;

    let newFontSize = localFontSize;
    if (currentHeight > maxContentHeight) {
      newFontSize = Math.min(58, localFontSize - 1);
    } else if (currentHeight < minContentHeight) {
      newFontSize = Math.min(58, localFontSize + 1);
    }

    if (newFontSize !== localFontSize) {
      setLocalFontSize(newFontSize);
      onFontSizeChange?.(newFontSize);
    } else if (
      currentHeight >= minContentHeight &&
      currentHeight <= maxContentHeight
    ) {
      // Font size has settled - notify parent
      onFontSizeChange?.(localFontSize);
    }
  }, [
    contentHeight,
    localFontSize,
    canvasHeight,
    externalFontSize,
    onFontSizeChange,
  ]);

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
