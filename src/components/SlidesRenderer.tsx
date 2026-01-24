"use client";

import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import dynamicImport from "next/dynamic";
import type Konva from "konva";
import { Format, FORMAT_DIMENSIONS } from "../lib/formats";

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

  // Callback when all stages are mounted (optional, for export)
  onReady?: () => void;

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
  onReady,
  showAllSlides = false,
}: SlidesRendererProps) {
  const { width: canvasWidth, height: canvasHeight } =
    FORMAT_DIMENSIONS[format];

  // Track stages that have been registered for onReady callback
  const stagesReadyRef = useRef(0);
  const hasCalledOnReady = useRef(false);
  const expectedStages = 1 + slidesContent.length + (subForMore ? 1 : 0);

  // Reset refs when component mounts or slide count changes
  useEffect(() => {
    if (stagesRef) {
      stagesRef.current = [];
    }
    stagesReadyRef.current = 0;
    hasCalledOnReady.current = false;
  }, [stagesRef, expectedStages]);

  const handleStageRef = useCallback(
    (index: number) => (el: Konva.Stage | null) => {
      if (el) {
        if (stagesRef) {
          stagesRef.current[index] = el;
        }

        // Track for onReady callback
        if (onReady && !hasCalledOnReady.current) {
          stagesReadyRef.current++;
          if (stagesReadyRef.current === expectedStages) {
            hasCalledOnReady.current = true;
            // Small delay for Konva to finish painting
            setTimeout(() => onReady(), 50);
          }
        }
      }
    },
    [stagesRef, onReady, expectedStages],
  );

  // No-op ref for when stagesRef is not provided
  const noopRef = useCallback(() => {}, []);

  const getRef = useCallback(
    (index: number) => {
      if (stagesRef || onReady) {
        return handleStageRef(index);
      }
      return noopRef;
    },
    [stagesRef, onReady, handleStageRef, noopRef],
  );

  return (
    <>
      <FirstSlide
        img={img}
        imgX={imgX}
        position={position}
        rubrique={rubrique}
        title={title}
        intro={intro}
        scale={scale}
        width={width}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        display={showAllSlides || currentSlide === 0}
        onImgXChange={onImgXChange || (() => {})}
        ref={getRef(0)}
      />
      {slidesContent.map((content, i) => (
        <ContentSlide
          key={i}
          backgroundImg={blurredImg || undefined}
          originalImg={img}
          imgX={imgX}
          rubrique={rubrique}
          content={content}
          scale={scale}
          width={width}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          display={showAllSlides || i + 1 === currentSlide}
          last={i === slidesContent.length - 1}
          ref={getRef(i + 1)}
        />
      ))}
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
