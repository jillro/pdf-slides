"use client";

import { MutableRefObject, useCallback, useEffect } from "react";
import dynamicImport from "next/dynamic";
import type Konva from "konva";
import { Format, FORMAT_DIMENSIONS } from "../lib/formats";
import { applyFrenchTypography } from "../lib/french-typography";
import { parseHighlights, type TextSegment } from "../lib/rich-text-parser";

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
        return (
          <ContentSlide
            key={i}
            backgroundImg={blurredImg || undefined}
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
