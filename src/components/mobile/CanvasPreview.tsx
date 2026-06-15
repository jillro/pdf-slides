"use client";

import styles from "./CanvasPreview.module.css";
import { useRef } from "react";
import { useResizeObserver } from "usehooks-ts";
import SlidesRenderer from "../SlidesRenderer";
import { FORMAT_DIMENSIONS } from "../../lib/formats";
import { usePostEditor } from "../PostEditorContext";

interface CanvasPreviewProps {
  totalSlides: number;
  onTap: () => void;
}

export default function CanvasPreview({
  totalSlides,
  onTap,
}: CanvasPreviewProps) {
  const { post, img, blurredImg, currentSlide, stagesRef } = usePostEditor();

  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useResizeObserver({
    ref: containerRef,
    box: "content-box",
  });

  const { width: canvasWidth } = FORMAT_DIMENSIONS[post.format];

  // Scale to fit container width while maintaining aspect ratio
  const scale = containerWidth ? containerWidth / canvasWidth : 0;

  return (
    <div className={styles.container} onClick={onTap}>
      <div className={styles.canvasWrapper} ref={containerRef}>
        <SlidesRenderer
          img={img}
          blurredImg={blurredImg}
          imgX={post.imgX}
          position={post.position}
          rubrique={post.rubrique}
          title={post.title}
          intro={post.intro}
          format={post.format}
          slidesContent={post.slidesContent}
          slideThemes={post.slideThemes}
          subForMore={post.subForMore}
          numero={post.numero}
          currentSlide={currentSlide}
          scale={scale}
          width={containerWidth || 0}
          stagesRef={stagesRef}
        />
      </div>
      <div className={styles.slideIndicator}>
        {currentSlide + 1} / {totalSlides}
      </div>
      <div className={styles.tapHint}>Toucher pour agrandir</div>
    </div>
  );
}
