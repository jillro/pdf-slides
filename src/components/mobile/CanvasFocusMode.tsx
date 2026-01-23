"use client";

import styles from "./CanvasFocusMode.module.css";
import { useRef, useState, MutableRefObject } from "react";
import { useGesture } from "@use-gesture/react";
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

interface CanvasFocusModeProps {
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
  onSlideChange: (slide: number) => void;
  onImgXChange: (x: number) => void;
  onClose: () => void;
  stagesRef: MutableRefObject<unknown[]>;
}

export default function CanvasFocusMode({
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
  onSlideChange,
  onImgXChange,
  onClose,
  stagesRef,
}: CanvasFocusModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useResizeObserver({
    ref: containerRef,
    box: "content-box",
  });

  const [scale, setScale] = useState(1);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { width: canvasWidth, height: canvasHeight } =
    FORMAT_DIMENSIONS[format];

  // Calculate scale to fit canvas in viewport
  const fitScale =
    containerWidth && containerHeight
      ? Math.min(
          (containerWidth * 0.9) / canvasWidth,
          (containerHeight * 0.8) / canvasHeight,
        )
      : 0;

  const totalSlides = 1 + slidesContent.length + (subForMore ? 1 : 0);

  const goToNextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      onSlideChange(currentSlide + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      onSlideChange(currentSlide - 1);
    }
  };

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx, my], direction: [dx], velocity: [vx, vy], last, cancel }) => {
        // Only allow vertical drag when not zoomed
        if (scale > 1) {
          cancel?.();
          return;
        }

        setIsDragging(true);
        setDragY(my);

        if (last) {
          setIsDragging(false);
          // Dismiss if dragged down more than 150px or with velocity
          if (my > 150 || (my > 50 && vy > 0.5)) {
            onClose();
          } else if (Math.abs(mx) > 80 || (Math.abs(mx) > 30 && vx > 0.5)) {
            // Horizontal swipe for slide navigation
            if (dx > 0) {
              goToPrevSlide();
            } else {
              goToNextSlide();
            }
          }
          setDragY(0);
        }
      },
      onPinch: ({ offset: [d], last }) => {
        const newScale = Math.max(1, Math.min(3, d));
        setScale(newScale);
        if (last && newScale < 1.1) {
          setScale(1);
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        threshold: 10,
      },
      pinch: {
        scaleBounds: { min: 1, max: 3 },
      },
    },
  );

  const overlayStyle = {
    opacity: isDragging ? Math.max(0, 1 - dragY / 300) : 1,
    transform: isDragging ? `translateY(${dragY}px)` : "none",
    transition: isDragging ? "none" : "transform 0.2s, opacity 0.2s",
  };

  return (
    <div className={styles.overlay} ref={containerRef} {...bind()}>
      <button className={styles.closeButton} onClick={onClose}>
        &times;
      </button>

      <div className={styles.canvasContainer} style={overlayStyle}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s",
          }}
        >
          <FirstSlide
            img={img}
            imgX={imgX}
            position={position}
            rubrique={rubrique}
            title={title}
            intro={intro}
            scale={fitScale}
            width={fitScale * canvasWidth}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            ref={(el) => {
              if (el) stagesRef.current[0] = el;
            }}
            display={currentSlide === 0}
            onImgXChange={onImgXChange}
          />
          {slidesContent.map((content, i) => (
            <ContentSlide
              key={i}
              img={img}
              imgX={imgX}
              rubrique={rubrique}
              content={content}
              scale={fitScale}
              width={fitScale * canvasWidth}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              ref={(el) => {
                if (el) stagesRef.current[i + 1] = el;
              }}
              display={i + 1 === currentSlide}
              last={i + 1 === slidesContent.length}
            />
          ))}
          {subForMore && (
            <SubForMoreSlide
              img={img}
              imgX={imgX}
              numero={numero}
              scale={fitScale}
              width={fitScale * canvasWidth}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              ref={(el) => {
                if (el) stagesRef.current[slidesContent.length + 1] = el;
              }}
              display={currentSlide === slidesContent.length + 1}
            />
          )}
        </div>
      </div>

      <div className={styles.navigation}>
        <button
          className={styles.navButton}
          onClick={goToPrevSlide}
          disabled={currentSlide === 0}
        >
          &lt;
        </button>
        <span className={styles.slideCounter}>
          {currentSlide + 1} / {totalSlides}
        </span>
        <button
          className={styles.navButton}
          onClick={goToNextSlide}
          disabled={currentSlide === totalSlides - 1}
        >
          &gt;
        </button>
      </div>

      <div className={styles.gestureHint}>
        Glisser vers le bas pour fermer
      </div>
    </div>
  );
}
