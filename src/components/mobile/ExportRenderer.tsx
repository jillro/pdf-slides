"use client";

import styles from "./ExportRenderer.module.css";
import { MutableRefObject, useEffect, useRef } from "react";
import dynamicImport from "next/dynamic";
import { Format, FORMAT_DIMENSIONS } from "../../lib/formats";

const FirstSlide = dynamicImport(() => import("../FirstSlide"), { ssr: false });
const ContentSlide = dynamicImport(() => import("../ContentSlide"), {
  ssr: false,
});
const SubForMoreSlide = dynamicImport(() => import("../SubForMoreSlide"), {
  ssr: false,
});

interface ExportRendererProps {
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
  stagesRef: MutableRefObject<unknown[]>;
  onReady: () => void;
  // Shared text measurement state (from preview)
  titleHeight: number;
  introHeight: number;
  contentFontSizes: number[];
}

export default function ExportRenderer({
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
  stagesRef,
  onReady,
  titleHeight,
  introHeight,
  contentFontSizes,
}: ExportRendererProps) {
  const { width: canvasWidth, height: canvasHeight } =
    FORMAT_DIMENSIONS[format];

  // Track stages that have been registered
  const stagesReadyRef = useRef(0);
  const hasCalledOnReady = useRef(false);
  const expectedStages = 1 + slidesContent.length + (subForMore ? 1 : 0);

  const handleStageRef = (index: number) => (el: unknown) => {
    if (el && !stagesRef.current[index]) {
      stagesRef.current[index] = el;
      stagesReadyRef.current++;

      // When all stages are mounted, signal ready after a short delay for rendering
      if (
        stagesReadyRef.current === expectedStages &&
        !hasCalledOnReady.current
      ) {
        hasCalledOnReady.current = true;
        // Small delay for Konva to finish painting
        setTimeout(() => onReady(), 50);
      }
    }
  };

  // Reset refs when component mounts
  useEffect(() => {
    stagesRef.current = [];
    stagesReadyRef.current = 0;
    hasCalledOnReady.current = false;
  }, [stagesRef]);

  return (
    <div className={styles.container}>
      <FirstSlide
        img={img}
        imgX={imgX}
        position={position}
        rubrique={rubrique}
        title={title}
        intro={intro}
        scale={1}
        width={canvasWidth}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        display={true}
        onImgXChange={() => {}}
        ref={handleStageRef(0)}
        titleHeight={titleHeight}
        introHeight={introHeight}
      />
      {slidesContent.map((content, i) => (
        <ContentSlide
          key={i}
          backgroundImg={blurredImg || undefined}
          originalImg={img}
          imgX={imgX}
          rubrique={rubrique}
          content={content}
          scale={1}
          width={canvasWidth}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          display={true}
          last={i + 1 === slidesContent.length}
          ref={handleStageRef(i + 1)}
          fontSize={contentFontSizes[i]}
        />
      ))}
      {subForMore && (
        <SubForMoreSlide
          backgroundImg={blurredImg || undefined}
          originalImg={img}
          imgX={imgX}
          numero={numero}
          scale={1}
          width={canvasWidth}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          display={true}
          ref={handleStageRef(slidesContent.length + 1)}
        />
      )}
    </div>
  );
}
