"use client";

import styles from "./MobileLayout.module.css";
import { useState, useRef, useCallback, MutableRefObject } from "react";
import TabNavigation, { TabId } from "./TabNavigation";
import TabPanel from "./TabPanel";
import CanvasPreview from "./CanvasPreview";
import CanvasFocusMode from "./CanvasFocusMode";
import ExportRenderer from "./ExportRenderer";
import ContenuTab from "../tabs/ContenuTab";
import SlidesTab from "../tabs/SlidesTab";
import ImageTab from "../tabs/ImageTab";
import PartagerTab from "../tabs/PartagerTab";
import { Format } from "../../lib/formats";

interface MobileLayoutProps {
  // Canvas props
  img: HTMLImageElement | undefined;
  blurredImg: HTMLImageElement | null;
  imgX: number;
  setImgX: (x: number) => void;
  position: "top" | "bottom";
  setPosition: (value: "top" | "bottom") => void;
  unsavedPosition: boolean;
  rubrique: string;
  setRubrique: (value: string) => void;
  unsavedRubrique: boolean;
  title: string;
  setTitle: (value: string) => void;
  unsavedTitle: boolean;
  intro: string;
  setIntro: (value: string) => void;
  unsavedIntro: boolean;
  format: Format;
  setFormat: (value: Format) => void;
  unsavedFormat: boolean;
  slidesContent: string[];
  setSlidesContent: (value: string[]) => void;
  unsavedSlidesContent: boolean;
  subForMore: boolean;
  setSubForMore: (value: boolean) => void;
  unsavedSubForMore: boolean;
  numero: number;
  setNumero: (value: number) => void;
  unsavedNumero: boolean;

  // Legend props
  legendContent: string;
  setLegendContent: (value: string) => void;
  unsavedLegendContent: boolean;
  imageCaption: string | null;
  setImageCaption: (value: string | null) => void;
  unsavedImageCaption: boolean;
  articleUrl: string | null;

  // WordPress props
  wpUrl: string;
  setWpUrl: (url: string) => void;
  wpLoading: boolean;
  wpError: string | null;
  setWpError: (error: string | null) => void;
  importWithContent: boolean;
  setImportWithContent: (value: boolean) => void;
  onWordPressImport: () => void;

  // Image upload
  onImageUpload: (file: File) => void;

  // Download
  onDownload: () => void;

  // Slide navigation
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;

  // Stages ref
  stagesRef: MutableRefObject<unknown[]>;
}

export default function MobileLayout({
  img,
  blurredImg,
  imgX,
  setImgX,
  position,
  setPosition,
  unsavedPosition,
  rubrique,
  setRubrique,
  unsavedRubrique,
  title,
  setTitle,
  unsavedTitle,
  intro,
  setIntro,
  unsavedIntro,
  format,
  setFormat,
  unsavedFormat,
  slidesContent,
  setSlidesContent,
  unsavedSlidesContent,
  subForMore,
  setSubForMore,
  unsavedSubForMore,
  numero,
  setNumero,
  unsavedNumero,
  legendContent,
  setLegendContent,
  unsavedLegendContent,
  imageCaption,
  setImageCaption,
  unsavedImageCaption,
  articleUrl,
  wpUrl,
  setWpUrl,
  wpLoading,
  wpError,
  setWpError,
  importWithContent,
  setImportWithContent,
  onWordPressImport,
  onImageUpload,
  onDownload,
  currentSlide,
  setCurrentSlide,
  stagesRef,
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabId>("contenu");
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportReadyResolveRef = useRef<(() => void) | null>(null);

  // Shared text measurement state (calculated by preview, used by export)
  const [titleHeight, setTitleHeight] = useState<number>(0);
  const [introHeight, setIntroHeight] = useState<number>(0);
  const [contentFontSizes, setContentFontSizes] = useState<number[]>([]);

  const handleContentFontSizeChange = useCallback(
    (index: number, size: number) => {
      setContentFontSizes((prev) => {
        const next = [...prev];
        next[index] = size;
        return next;
      });
    },
    [],
  );

  const handleDownload = useCallback(() => {
    // Don't export if measurements haven't been calculated
    if (titleHeight === 0 && title.length > 0) {
      console.warn("Export blocked: measurements not ready");
      return;
    }
    setExporting(true);
    new Promise<void>((resolve) => {
      exportReadyResolveRef.current = resolve;
    }).then(() => {
      onDownload();
      setExporting(false);
    });
  }, [onDownload, titleHeight, title.length]);

  const handleExportReady = useCallback(() => {
    exportReadyResolveRef.current?.();
    exportReadyResolveRef.current = null;
  }, []);

  const unsavedByTab: Record<TabId, boolean> = {
    contenu: unsavedTitle || unsavedIntro || unsavedRubrique,
    slides: unsavedSlidesContent,
    image: unsavedFormat || unsavedPosition,
    partager:
      unsavedSubForMore ||
      unsavedNumero ||
      unsavedLegendContent ||
      unsavedImageCaption,
  };

  return (
    <div className={styles.mobileLayout}>
      <CanvasPreview
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
        onTap={() => setFocusModeOpen(true)}
        titleHeight={titleHeight}
        introHeight={introHeight}
        onTitleHeightChange={setTitleHeight}
        onIntroHeightChange={setIntroHeight}
        contentFontSizes={contentFontSizes}
        onContentFontSizeChange={handleContentFontSizeChange}
      />

      <TabPanel>
        {activeTab === "contenu" && (
          <ContenuTab
            wpUrl={wpUrl}
            setWpUrl={setWpUrl}
            wpLoading={wpLoading}
            wpError={wpError}
            setWpError={setWpError}
            importWithContent={importWithContent}
            setImportWithContent={setImportWithContent}
            onWordPressImport={onWordPressImport}
            rubrique={rubrique}
            setRubrique={setRubrique}
            unsavedRubrique={unsavedRubrique}
            title={title}
            setTitle={setTitle}
            unsavedTitle={unsavedTitle}
            intro={intro}
            setIntro={setIntro}
            unsavedIntro={unsavedIntro}
          />
        )}
        {activeTab === "slides" && (
          <SlidesTab
            slidesContent={slidesContent}
            setSlidesContent={setSlidesContent}
            unsavedSlidesContent={unsavedSlidesContent}
          />
        )}
        {activeTab === "image" && (
          <ImageTab
            format={format}
            setFormat={setFormat}
            unsavedFormat={unsavedFormat}
            position={position}
            setPosition={setPosition}
            unsavedPosition={unsavedPosition}
            img={img}
            imgX={imgX}
            setImgX={setImgX}
            onImageUpload={onImageUpload}
          />
        )}
        {activeTab === "partager" && (
          <PartagerTab
            subForMore={subForMore}
            setSubForMore={setSubForMore}
            unsavedSubForMore={unsavedSubForMore}
            numero={numero}
            setNumero={setNumero}
            unsavedNumero={unsavedNumero}
            legendContent={legendContent}
            setLegendContent={setLegendContent}
            unsavedLegendContent={unsavedLegendContent}
            imageCaption={imageCaption}
            setImageCaption={setImageCaption}
            unsavedImageCaption={unsavedImageCaption}
            articleUrl={articleUrl}
            onDownload={handleDownload}
            exporting={exporting}
          />
        )}
      </TabPanel>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unsavedByTab={unsavedByTab}
      />

      {focusModeOpen && (
        <CanvasFocusMode
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
          onSlideChange={setCurrentSlide}
          onImgXChange={setImgX}
          onClose={() => setFocusModeOpen(false)}
          titleHeight={titleHeight}
          introHeight={introHeight}
          onTitleHeightChange={setTitleHeight}
          onIntroHeightChange={setIntroHeight}
          contentFontSizes={contentFontSizes}
          onContentFontSizeChange={handleContentFontSizeChange}
        />
      )}

      {exporting && (
        <ExportRenderer
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
          stagesRef={stagesRef}
          onReady={handleExportReady}
          titleHeight={titleHeight}
          introHeight={introHeight}
          contentFontSizes={contentFontSizes}
        />
      )}
    </div>
  );
}
