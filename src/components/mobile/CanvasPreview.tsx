"use client";

import styles from "./CanvasPreview.module.css";
import { useRef } from "react";
import { useResizeObserver } from "usehooks-ts";
import SlidesRenderer from "../SlidesRenderer";
import { Format, FORMAT_DIMENSIONS } from "../../lib/formats";

interface CanvasPreviewProps {
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
  currentSlide: number;
  totalSlides: number;
  onTap: () => void;
}

export default function CanvasPreview({
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
  totalSlides,
  onTap,
}: CanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useResizeObserver({
    ref: containerRef,
    box: "content-box",
  });

  const { width: canvasWidth } = FORMAT_DIMENSIONS[format];

  // Scale to fit container width while maintaining aspect ratio
  const scale = containerWidth ? containerWidth / canvasWidth : 0;

  return (
    <div className={styles.container} onClick={onTap}>
      <div className={styles.canvasWrapper} ref={containerRef}>
        <SlidesRenderer
          img={img}
          blurredImg={blurredImg}
          imgX={imgX}
          position={position}
          rubrique={rubrique}
          title={title}
          intro={intro}
          format={format}
          slidesContent={slidesContent}
          subForMore={subForMore}
          numero={numero}
          currentSlide={currentSlide}
          scale={scale}
          width={containerWidth || 0}
        />
      </div>
      <div className={styles.slideIndicator}>
        {currentSlide + 1} / {totalSlides}
      </div>
      <div className={styles.tapHint}>Toucher pour agrandir</div>
    </div>
  );
}
