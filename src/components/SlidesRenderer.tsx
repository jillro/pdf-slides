"use client";

import { MutableRefObject, useCallback, useEffect } from "react";
import dynamicImport from "next/dynamic";
import type Konva from "konva";
import useImage from "use-image";
import { Format, FORMAT_DIMENSIONS } from "../lib/formats";
import { applyFrenchTypography } from "../lib/french-typography";
import { parseHighlights, type TextSegment } from "../lib/rich-text-parser";
import {
  CONTENT_BG_THEMES,
  DEFAULT_CONTENT_BG_THEME,
  type ContentBgThemeId,
} from "../lib/contentBgThemes";

const FirstSlide = dynamicImport(() => import("./FirstSlide"), { ssr: false });
const ContentSlide = dynamicImport(() => import("./ContentSlide"), {
  ssr: false,
});
const SubForMoreSlide = dynamicImport(() => import("./SubForMoreSlide"), {
  ssr: false,
});

export interface SlidesRendererProps {
  // Data props
  img: HTMLImageElement | undefined;
  blurredImg: HTMLImageElement | null;
  imgX: number;
  position: "top" | "bottom";
  rubrique: string;
  title: string;
  intro: string;
  format: Format;
  slidesContent: string[];
  slideThemes: ContentBgThemeId[];
  subForMore: boolean;
  numero: number;

  // Display control
  currentSlide: number;

  // Scale
  scale: number;
  width: number;

  // Interaction (optional)
  onImgXChange?: (x: number) => void;

  // Export refs (optional) - uses unknown[] for compatibility with parent refs
  stagesRef?: MutableRefObject<unknown[]>;

  // When true, all slides display={true} (for export). Default false.
  showAllSlides?: boolean;
}

export default function SlidesRenderer({
  img,
  blurredImg,
  imgX,
  position,
  rubrique,
  title,
  intro,
  format,
  slidesContent,
  slideThemes,
  subForMore,
  numero,
  currentSlide,
  scale,
  width,
  onImgXChange,
  stagesRef,
  showAllSlides = false,
}: SlidesRendererProps) {
  const { width: canvasWidth, height: canvasHeight } =
    FORMAT_DIMENSIONS[format];

  const [altBg1Img] = useImage(
    CONTENT_BG_THEMES.alt_bg1.src ?? "",
    "anonymous",
  );
  const [altBg2Img] = useImage(
    CONTENT_BG_THEMES.alt_bg2.src ?? "",
    "anonymous",
  );
  const themeImages: Record<ContentBgThemeId, HTMLImageElement | undefined> = {
    blurred: blurredImg ?? undefined,
    alt_bg1: altBg1Img,
    alt_bg2: altBg2Img,
  };

  const expectedStages = 1 + slidesContent.length + (subForMore ? 1 : 0);

  // Reset refs when component mounts or slide count changes
  useEffect(() => {
    if (stagesRef) {
      stagesRef.current = [];
    }
  }, [stagesRef, expectedStages]);

  const handleStageRef = useCallback(
    (index: number) => (el: Konva.Stage | null) => {
      if (el && stagesRef) {
        stagesRef.current[index] = el;
      }
    },
    [stagesRef],
  );

  // No-op ref for when stagesRef is not provided
  const noopRef = useCallback(() => {}, []);

  const getRef = useCallback(
    (index: number) => {
      if (stagesRef) {
        return handleStageRef(index);
      }
      return noopRef;
    },
    [stagesRef, handleStageRef, noopRef],
  );

  return (
    <>
      <FirstSlide
        img={img}
        imgX={imgX}
        position={position}
        rubrique={applyFrenchTypography(rubrique)}
        title={applyFrenchTypography(title)}
        intro={applyFrenchTypography(intro)}
        scale={scale}
        width={width}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        display={showAllSlides || currentSlide === 0}
        onImgXChange={onImgXChange || (() => {})}
        ref={getRef(0)}
      />
      {slidesContent.map((content, i) => {
        // Parse highlight markers and apply French typography per segment
        const segments: TextSegment[] = parseHighlights(content.trim()).map(
          (seg) => ({
            ...seg,
            text: applyFrenchTypography(seg.text),
          }),
        );
        const themeId = slideThemes[i] ?? DEFAULT_CONTENT_BG_THEME;
        const theme =
          CONTENT_BG_THEMES[themeId] ??
          CONTENT_BG_THEMES[DEFAULT_CONTENT_BG_THEME];
        const backgroundImg = themeImages[themeId];
        return (
          <ContentSlide
            key={i}
            backgroundImg={backgroundImg || undefined}
            originalImg={img}
            imgX={imgX}
            rubrique={applyFrenchTypography(rubrique)}
            segments={segments}
            scale={scale}
            width={width}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            display={showAllSlides || i + 1 === currentSlide}
            last={i === slidesContent.length - 1}
            theme={theme}
            ref={getRef(i + 1)}
          />
        );
      })}
      {subForMore && (
        <SubForMoreSlide
          backgroundImg={blurredImg || undefined}
          originalImg={img}
          imgX={imgX}
          numero={numero}
          scale={scale}
          width={width}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          display={showAllSlides || currentSlide === slidesContent.length + 1}
          ref={getRef(slidesContent.length + 1)}
        />
      )}
    </>
  );
}
