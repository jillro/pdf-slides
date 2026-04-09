"use client";

import { useLogoImage } from "../lib/useLogoImage";
import { useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import { Image as KImage, Layer, Rect, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";
import { getImageLuminosity, calculateOverlayOpacity } from "../lib/luminosity";
import RichContentRenderer, { computeTextHeight } from "./RichContentRenderer";
import type { TextSegment } from "../lib/rich-text-parser";

const CONTENT_MARGIN = 80;
const ACCENT_COLOR = "#ffd9af";

export default function ContentSlide(props: {
  backgroundImg?: HTMLImageElement;
  originalImg?: HTMLImageElement;
  imgX: number;
  rubrique: string;
  segments: TextSegment[];
  scale: number;
  width: number;
  canvasWidth: number;
  canvasHeight: number;
  ref: React.Ref<Konva.Stage>;
  display: boolean;
  last?: boolean;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
}) {
  const {
    originalImg,
    rubrique,
    segments,
    canvasWidth,
    canvasHeight,
    fontSize: externalFontSize,
    onFontSizeChange,
  } = props;

  const [logo] = useLogoImage();

  const [rubriqueWidth, setRubriqueWidth] = useState<number>(0);
  const [localFontSize, setLocalFontSize] = useState<number>(58);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.61);

  const fontSize = externalFontSize ?? localFontSize;
  const lineHeight = 1.2 + (58 - fontSize) * 0.01;
  const contentWidth = canvasWidth - CONTENT_MARGIN * 2;
  const fontFamily = "Atkinson Hyperlegible";

  const rubriqueRef = useRef<Konva.Text>(null);

  // Compute content height synchronously — no render loops
  const contentHeight = useMemo(
    () =>
      computeTextHeight(
        segments,
        contentWidth,
        fontSize,
        lineHeight,
        fontFamily,
      ),
    [segments, contentWidth, fontSize, lineHeight],
  );

  useEffect(() => {
    if (originalImg) {
      const luminosity = getImageLuminosity(originalImg);
      const opacity = calculateOverlayOpacity(luminosity, 0.5, 0.8);
      setOverlayOpacity(opacity);
    } else {
      setOverlayOpacity(0.61);
    }
  }, [originalImg]);

  useEffect(() => {
    setRubriqueWidth(rubriqueRef.current?.width() || 0);
  }, [rubrique]);

  // Auto-sizing
  useEffect(() => {
    if (externalFontSize !== undefined) return;

    const maxContentHeight = canvasHeight * 0.74;
    const minContentHeight = canvasHeight * 0.67;

    let newFontSize = localFontSize;
    if (contentHeight > maxContentHeight) {
      newFontSize = Math.min(58, localFontSize - 1);
    } else if (contentHeight < minContentHeight) {
      newFontSize = Math.min(58, localFontSize + 1);
    }

    if (newFontSize !== localFontSize) {
      setLocalFontSize(newFontSize);
      onFontSizeChange?.(newFontSize);
    } else if (
      contentHeight >= minContentHeight &&
      contentHeight <= maxContentHeight
    ) {
      onFontSizeChange?.(localFontSize);
    }
  }, [
    contentHeight,
    localFontSize,
    canvasHeight,
    externalFontSize,
    onFontSizeChange,
  ]);

  const contentY = (canvasHeight - contentHeight) / 2;

  return (
    <Stage
      scaleX={props.scale}
      scaleY={props.scale}
      width={props.width}
      height={props.width ? (props.width * canvasHeight) / canvasWidth : 0}
      ref={props.ref}
      style={{ display: props.display ? "block" : "none" }}
    >
      <Layer background={"white"}>
        {props.backgroundImg && (
          <BackgroundImage
            image={props.backgroundImg}
            x={props.imgX}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        )}
        <Rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill={`rgba(17,17,17,${overlayOpacity})`}
        />
        <KImage
          image={logo}
          x={canvasWidth - 150 - rubriqueWidth}
          y={62}
          width={60}
          height={45}
        />
        <Text
          text={props.rubrique}
          x={canvasWidth - 60 - rubriqueWidth}
          y={60}
          ref={rubriqueRef}
          fill={ACCENT_COLOR}
          wrap={"word"}
          fontSize={(60 / 80) * 64}
          fontFamily={"Rubik"}
        />

        <RichContentRenderer
          segments={segments}
          x={CONTENT_MARGIN}
          y={contentY}
          width={contentWidth}
          fontSize={fontSize}
          lineHeight={lineHeight}
          fontFamily={fontFamily}
        />

        {!props.last ? (
          <Text
            text=">"
            x={canvasWidth - CONTENT_MARGIN}
            y={canvasHeight - 207}
            width={contentWidth}
            fill={ACCENT_COLOR}
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
