"use client";

import styles from "./CanvasPreview.module.css";
import { useRef, useCallback } from "react";
import { useResizeObserver } from "usehooks-ts";
import dynamicImport from "next/dynamic";
import { Format, FORMAT_DIMENSIONS } from "../../lib/formats";

const FirstSlide = dynamicImport(() => import("../FirstSlide"), { ssr: false });
const ContentSlide = dynamicImport(() => import("../ContentSlide"), {
  ssr: false,
});
const SubForMoreSlide = dynamicImport(() => import("../SubForMoreSlide"), {
  ssr: false,
});

interface CanvasPreviewProps {
  img: HTMLImageElement | undefined;
  imgX: number;
  position: "top" | "bottom";
  rubrique: string;
  title: string;
  intro: string;
  format: Format;
  slidesContent: string[];
  subForMore: boolean;
  numero: number;
  currentSlide: number;
  onTap: () => void;
}

export default function CanvasPreview({
  img,
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
  onTap,
}: CanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useResizeObserver({
    ref: containerRef,
    box: "content-box",
  });

  const { width: canvasWidth, height: canvasHeight } =
    FORMAT_DIMENSIONS[format];

  // Scale to fit container width while maintaining aspect ratio
  const scale = containerWidth ? containerWidth / canvasWidth : 0;

  const totalSlides = 1 + slidesContent.length + (subForMore ? 1 : 0);

  // No-op ref for preview (we don't need export functionality here)
  const noopRef = useCallback(() => {}, []);

  // Determine which slide to render (only render the current one)
  const isFirstSlide = currentSlide === 0;
  const contentSlideIndex = currentSlide - 1;
  const isContentSlide =
    contentSlideIndex >= 0 && contentSlideIndex < slidesContent.length;
  const isSubForMoreSlide =
    subForMore && currentSlide === slidesContent.length + 1;

  return (
    <div className={styles.container} onClick={onTap}>
      <div className={styles.canvasWrapper} ref={containerRef}>
        {isFirstSlide && (
          <FirstSlide
            img={img}
            imgX={imgX}
            position={position}
            rubrique={rubrique}
            title={title}
            intro={intro}
            scale={scale}
            width={containerWidth || 0}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            display={true}
            onImgXChange={() => {}}
            ref={noopRef}
            previewMode={true}
          />
        )}
        {isContentSlide && (
          <ContentSlide
            img={img}
            imgX={imgX}
            rubrique={rubrique}
            content={slidesContent[contentSlideIndex]}
            scale={scale}
            width={containerWidth || 0}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            display={true}
            last={contentSlideIndex === slidesContent.length - 1}
            ref={noopRef}
            previewMode={true}
          />
        )}
        {isSubForMoreSlide && (
          <SubForMoreSlide
            img={img}
            imgX={imgX}
            numero={numero}
            scale={scale}
            width={containerWidth || 0}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            display={true}
            ref={noopRef}
            previewMode={true}
          />
        )}
      </div>
      <div className={styles.slideIndicator}>
        {currentSlide + 1} / {totalSlides}
      </div>
      <div className={styles.tapHint}>Toucher pour agrandir</div>
    </div>
  );
}
