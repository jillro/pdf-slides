"use client";

import { useLogoImage } from "../lib/useLogoImage";
import { useEffect, useMemo, useRef, useState } from "react";
import type Konva from "konva";
import { Image as KImage, Layer, Rect, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";
import { getImageLuminosity, calculateOverlayOpacity } from "../lib/luminosity";
import RichContentRenderer, { computeTextHeight } from "./RichContentRenderer";
import type { TextSegment } from "../lib/rich-text-parser";
import {
  CONTENT_BG_THEMES,
  type ContentBgTheme,
} from "../lib/contentBgThemes";

const CONTENT_MARGIN = 80;

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
  theme?: ContentBgTheme;
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

  const theme = props.theme ?? CONTENT_BG_THEMES.blurred;

  const [logo] = useLogoImage(theme.accentColor);

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
        theme.highlightBold,
      ),
    [segments, contentWidth, fontSize, lineHeight, theme.highlightBold],
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
        {props.backgroundImg &&
          (theme.id === "blurred" ? (
            <BackgroundImage
              image={props.backgroundImg}
              x={props.imgX}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          ) : (
            <KImage
              image={props.backgroundImg}
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
            />
          ))}
        {theme.drawOverlay && (
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill={`rgba(17,17,17,${overlayOpacity})`}
          />
        )}
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
          fill={theme.accentColor}
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
          normalColor={theme.textColor}
          highlightColor={theme.highlightColor}
          highlightBold={theme.highlightBold}
        />

        {!props.last ? (
          <Text
            text=">"
            x={canvasWidth - CONTENT_MARGIN}
            y={canvasHeight - 207}
            width={contentWidth}
            fill={theme.accentColor}
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
