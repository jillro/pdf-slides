"use client";

import styles from "./ImageTab.module.css";
import { useRef, useCallback } from "react";
import { useResizeObserver } from "usehooks-ts";
import dynamicImport from "next/dynamic";
import { Format, FORMAT_DIMENSIONS } from "../../lib/formats";

const FirstSlide = dynamicImport(() => import("../FirstSlide"), { ssr: false });

// Preview renders at half resolution for performance
const PREVIEW_SCALE = 0.5;

interface ImageTabProps {
  format: Format;
  setFormat: (value: Format) => void;
  unsavedFormat: boolean;

  position: "top" | "bottom";
  setPosition: (value: "top" | "bottom") => void;
  unsavedPosition: boolean;

  img: HTMLImageElement | undefined;
  imgX: number;
  setImgX: (x: number) => void;

  onImageUpload: (file: File) => void;
}

export default function ImageTab({
  format,
  setFormat,
  unsavedFormat,
  position,
  setPosition,
  unsavedPosition,
  img,
  imgX,
  setImgX,
  onImageUpload,
}: ImageTabProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const { width: previewWidth } = useResizeObserver({
    ref: previewRef,
    box: "content-box",
  });

  const { width: canvasWidth, height: canvasHeight } =
    FORMAT_DIMENSIONS[format];

  // Use reduced internal resolution for preview
  const previewCanvasWidth = canvasWidth * PREVIEW_SCALE;
  const previewCanvasHeight = canvasHeight * PREVIEW_SCALE;
  const scale = previewWidth ? previewWidth / previewCanvasWidth : 0;

  // No-op ref for preview (we don't need export functionality here)
  const noopRef = useCallback(() => {}, []);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label htmlFor="format" className={styles.sectionTitle}>
          Format {unsavedFormat && <span className={styles.unsaved}>⏳</span>}
        </label>
        <div className={styles.formatButtons}>
          <button
            className={`${styles.formatButton} ${format === "post" ? styles.active : ""}`}
            onClick={() => setFormat("post")}
          >
            Post (4:5)
          </button>
          <button
            className={`${styles.formatButton} ${format === "story" ? styles.active : ""}`}
            onClick={() => setFormat("story")}
          >
            Story (9:16)
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.sectionTitle}>Image</label>
        <div className={styles.uploadZone}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onImageUpload(e.target.files[0]);
              }
            }}
            className={styles.fileInput}
            id="image-upload"
          />
          <label htmlFor="image-upload" className={styles.uploadLabel}>
            {img ? "Changer l'image" : "Choisir une image"}
          </label>
        </div>
      </div>

      {img && (
        <div className={styles.section}>
          <label className={styles.sectionTitle}>
            Position de l&apos;image (glisser pour ajuster)
          </label>
          <div className={styles.previewContainer} ref={previewRef}>
            <FirstSlide
              img={img}
              imgX={imgX * PREVIEW_SCALE}
              position={position}
              rubrique=""
              title=""
              intro=""
              scale={scale}
              width={previewWidth || 0}
              canvasWidth={previewCanvasWidth}
              canvasHeight={previewCanvasHeight}
              display={true}
              onImgXChange={(x) => setImgX(x / PREVIEW_SCALE)}
              ref={noopRef}
              previewMode={true}
            />
          </div>
        </div>
      )}

      <div className={styles.section}>
        <label className={styles.sectionTitle}>
          Position du texte{" "}
          {unsavedPosition && <span className={styles.unsaved}>⏳</span>}
        </label>
        <div className={styles.positionButtons}>
          <button
            className={`${styles.positionButton} ${position === "top" ? styles.active : ""}`}
            onClick={() => setPosition("top")}
          >
            En haut
          </button>
          <button
            className={`${styles.positionButton} ${position === "bottom" ? styles.active : ""}`}
            onClick={() => setPosition("bottom")}
          >
            En bas
          </button>
        </div>
      </div>
    </div>
  );
}
