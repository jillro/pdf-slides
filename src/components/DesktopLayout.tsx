"use client";

import styles from "./AppView.module.css";

import { useRef, useState } from "react";
import { useResizeObserver } from "usehooks-ts";
import SlidesRenderer from "./SlidesRenderer";
import TabNavigation, {
  TabId,
  computeUnsavedByTab,
} from "./mobile/TabNavigation";
import TabPanel from "./mobile/TabPanel";
import ContenuTab from "./tabs/ContenuTab";
import FormatTab from "./tabs/FormatTab";
import PartagerTab from "./tabs/PartagerTab";

import { FORMAT_DIMENSIONS } from "../lib/formats";
import { slideCount } from "../lib/slides";
import { usePostEditor, usePostField } from "./PostEditorContext";

export default function DesktopLayout() {
  const colRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);

  // The result column holds the preview canvas plus the format panel and must
  // not exceed the viewport height. We measure the column (available space) and
  // the format panel, then shrink the preview so both fit without scrolling.
  const { width: colWidth = 0, height: colHeight = 0 } = useResizeObserver({
    ref: colRef,
    box: "content-box",
  });
  const { height: formatHeight = 0 } = useResizeObserver({
    ref: formatRef,
    box: "border-box",
  });

  const [activeTab, setActiveTab] = useState<TabId>("contenu");

  const [title] = usePostField("title");
  const [intro] = usePostField("intro");
  const [rubrique] = usePostField("rubrique");
  const [slidesContent] = usePostField("slidesContent");
  const [slideThemes] = usePostField("slideThemes");
  const [position] = usePostField("position");
  const [subForMore] = usePostField("subForMore");
  const [imgX, , setImgX] = usePostField("imgX");
  const [numero] = usePostField("numero");
  const [format] = usePostField("format");
  const [firstSlideLayout] = usePostField("firstSlideLayout");

  const { img, blurredImg, currentSlide, setCurrentSlide, stagesRef, unsaved } =
    usePostEditor();

  const unsavedByTab = computeUnsavedByTab(unsaved);

  const { width: canvasWidth, height: canvasHeight } =
    FORMAT_DIMENSIONS[format];

  // Space left for the preview once the format panel and the column gap (1rem)
  // are removed. Convert that height budget into a width via the canvas aspect
  // ratio, then keep whichever of width/height limit is more constraining.
  // Column gap (1rem) plus the canvas container's 1px top/bottom border.
  const RESERVED_HEIGHT = 16 + 2;
  const availableHeight = colHeight - formatHeight - RESERVED_HEIGHT;
  const widthFromHeight =
    availableHeight > 0
      ? (availableHeight * canvasWidth) / canvasHeight
      : colWidth;
  const displayWidth = Math.min(colWidth, widthFromHeight);
  const scale = canvasWidth ? displayWidth / canvasWidth : 0;

  return (
    <div className={styles.container}>
      <div className={styles.col + " " + styles.result} ref={colRef}>
        <div
          className={styles.canvasContainer}
          style={{ width: displayWidth || undefined }}
        >
          {currentSlide > 0 ? (
            <button
              className={styles.canvasOverlay + " " + styles.canvasPrev}
              onClick={() => setCurrentSlide(currentSlide - 1)}
            >
              &lt;
            </button>
          ) : null}
          {currentSlide < slideCount(slidesContent, subForMore) - 1 ? (
            <button
              className={styles.canvasOverlay + " " + styles.canvasNext}
              onClick={() => setCurrentSlide(currentSlide + 1)}
            >
              &gt;
            </button>
          ) : null}

          <SlidesRenderer
            img={img}
            blurredImg={blurredImg}
            imgX={imgX}
            position={position}
            rubrique={rubrique}
            title={title}
            intro={intro}
            format={format}
            firstSlideLayout={firstSlideLayout}
            slidesContent={slidesContent}
            slideThemes={slideThemes}
            subForMore={subForMore}
            numero={numero}
            currentSlide={currentSlide}
            scale={scale}
            width={displayWidth}
            onImgXChange={setImgX}
            stagesRef={stagesRef}
          />
        </div>

        <div ref={formatRef}>
          <FormatTab desktop />
        </div>
      </div>
      <div className={styles.col + " " + styles.panel}>
        <TabNavigation
          variant="top"
          tabs={["contenu", "partager"]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unsavedByTab={unsavedByTab}
        />
        <TabPanel variant="top">
          {activeTab === "contenu" && <ContenuTab desktop />}
          {activeTab === "partager" && <PartagerTab />}
        </TabPanel>
      </div>
    </div>
  );
}
