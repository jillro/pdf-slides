"use client";

import styles from "./AppView.module.css";

import { useCallback, useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import SlideContentEditor from "./SlideContentEditor/SlideContentEditor";
import LegendGenerator from "./LegendGenerator";
import SlidesRenderer from "./SlidesRenderer";
import JSZip from "jszip";
import useImage from "use-image";
import { useInterval, useResizeObserver, useMediaQuery } from "usehooks-ts";

import { Post, savePost } from "../app/storage";
import { importFromWordPress } from "../app/wordpress";
import { Format, FORMAT_DIMENSIONS, MAX_FORMAT_HEIGHT } from "../lib/formats";
import { createBlurredImage } from "../lib/blur";
import MobileLayout from "./mobile/MobileLayout";

async function resizeImage(imgBlob: Blob): Promise<string> {
  // Get image current height
  const img = new Image();
  img.src = URL.createObjectURL(imgBlob);
  await new Promise<void>((resolve) => (img.onload = () => resolve()));

  // Scale down the image to target height, keeping the aspect ratio
  const canvas = document.createElement("canvas");
  canvas.height = MAX_FORMAT_HEIGHT;
  canvas.width = (MAX_FORMAT_HEIGHT * img.width) / img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL();
}

function useSavedPost(id: string, init: Post) {
  const [scheduledChanges, setScheduledChanges] = useState<Partial<Post>>({});
  const scheduleSave = <K extends keyof Post>(key: K, value: Post[K]) => {
    setScheduledChanges((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useInterval(async () => {
    if (Object.keys(scheduledChanges).length === 0) return;
    await savePost({ ...scheduledChanges, id });
    setScheduledChanges({});
  }, 1000);

  return useCallback(
    function useSavedState<K extends keyof Post>(
      key: K,
      defaultValue: Post[K],
    ): [Post[K], boolean, (value: Post[K]) => void] {
      const [state, setState] = useState<Post[K]>(init[key] || defaultValue);
      const unsaved = key in scheduledChanges;

      return [
        state,
        unsaved,
        (value: Post[K]) => {
          setState(value);
          scheduleSave(key, value);
        },
      ];
    },
    [init, scheduledChanges],
  );
}

export default function AppView(params: { post?: Post }) {
  const init = params.post;
  const id = params.post.id;
  const ref = useRef<HTMLDivElement>(null);

  // Mobile detection
  const isMobile = useMediaQuery("(max-width: 767px)");

  const { width: colWidth } = useResizeObserver({
    ref,
    box: "content-box",
  });

  const useSavedState = useSavedPost(id, init);
  const [title, unsavedTitle, setTitle] = useSavedState("title", "");
  const [intro, unsavedIntro, setIntro] = useSavedState("intro", "");
  const [rubrique, unsavedRubrique, setRubrique] = useSavedState(
    "rubrique",
    "édito",
  );
  const [slidesContent, unsavedSlidesContent, setSlidesContent] = useSavedState(
    "slidesContent",
    [],
  );
  const [position, unsavedPosition, setPosition] = useSavedState(
    "position",
    "top",
  );
  const [subForMore, unsavedSubForMore, setSubForMore] = useSavedState(
    "subForMore",
    false,
  );
  const [imgX, , setImgX] = useSavedState("imgX", 0);
  const [numero, unsavedNumero, setNumero] = useSavedState("numero", 1);
  const [format, unsavedFormat, setFormat] = useSavedState(
    "format",
    "post" as Format,
  );
  const [legendContent, unsavedLegendContent, setLegendContent] = useSavedState(
    "legendContent",
    "",
  );
  const [imageCaption, unsavedImageCaption, setImageCaption] = useSavedState(
    "imageCaption",
    null,
  );
  const [articleUrl, , setArticleUrl] = useSavedState("articleUrl", null);
  const [imgDataUrl, setImgDataUrl] = useState<string>(init.img || "");
  const [img] = useImage(imgDataUrl, "anonymous");
  const [blurredImg, setBlurredImg] = useState<HTMLImageElement | null>(null);

  // Generate blurred image when original image loads
  useEffect(() => {
    if (img) {
      createBlurredImage(img, 100).then(setBlurredImg);
    } else {
      setBlurredImg(null);
    }
  }, [img]);

  useEffect(() => {
    // This is only for saving the image
    (async () => {
      if (!imgDataUrl) return;
      await savePost({
        id: params.post.id,
        img: imgDataUrl,
      });
    })();
  }, [params.post.id, imgDataUrl]);

  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // WordPress import state
  const [wpUrl, setWpUrl] = useState("");
  const [wpLoading, setWpLoading] = useState(false);
  const [wpError, setWpError] = useState<string | null>(null);
  const [importWithContent, setImportWithContent] = useState(true);

  const { width: canvasWidth } = FORMAT_DIMENSIONS[format];
  const scale = colWidth ? colWidth / canvasWidth : 0;

  const stagesRef = useRef([]);

  const handleDownload = async () => {
    const isSingleSlide = slidesContent.length === 0 && !subForMore;

    if (isSingleSlide) {
      // Single slide: export as PNG directly
      const stage = stagesRef.current[0];
      const blob = await stage.toBlob({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob as Blob);
      link.download = "slide.png";
      link.click();
    } else {
      // Multiple slides: export as ZIP of PNGs
      const zip = new JSZip();
      await Promise.all(
        stagesRef.current.map(async (stage, i) => {
          zip.file(`${i}.png`, (await stage.toBlob({ pixelRatio: 2 })) as Blob);
        }),
      );
      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "slides.zip";
        link.click();
      });
    }
  };

  const handleWordPressImport = async () => {
    if (!wpUrl.trim()) {
      setWpError("URL invalide");
      return;
    }

    setWpLoading(true);
    setWpError(null);

    const result = await importFromWordPress(wpUrl);

    if (result.success === false) {
      setWpError(result.error);
      setWpLoading(false);
      return;
    }

    const {
      title: importedTitle,
      content,
      imageDataUrl,
      rubrique: importedRubrique,
      legendContent: importedLegendContent,
      articleUrl: importedArticleUrl,
      imageCaption: importedImageCaption,
    } = result.data;

    setTitle(importedTitle);
    if (importWithContent) {
      setSlidesContent([content]);
    }

    if (importedRubrique) {
      setRubrique(importedRubrique);
    }

    // Set legend-related fields
    setLegendContent(importedLegendContent);
    setArticleUrl(importedArticleUrl || null);
    setImageCaption(importedImageCaption);

    if (imageDataUrl) {
      // Convert base64 to blob and resize using existing resizeImage function
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const resizedDataUrl = await resizeImage(blob);
      setImgDataUrl(resizedDataUrl);
    }

    setWpLoading(false);
    setWpUrl("");
  };

  const handleImageUpload = async (file: File) => {
    setImgDataUrl(await resizeImage(file));
  };

  // Mobile layout
  if (isMobile) {
    return (
      <>
        <div className={styles.header}>
          <ThemeToggle />
        </div>
        <MobileLayout
          img={img}
          blurredImg={blurredImg}
          imgX={imgX}
          setImgX={setImgX}
          position={position}
          setPosition={setPosition}
          unsavedPosition={unsavedPosition}
          rubrique={rubrique}
          setRubrique={setRubrique}
          unsavedRubrique={unsavedRubrique}
          title={title}
          setTitle={setTitle}
          unsavedTitle={unsavedTitle}
          intro={intro}
          setIntro={setIntro}
          unsavedIntro={unsavedIntro}
          format={format}
          setFormat={setFormat}
          unsavedFormat={unsavedFormat}
          slidesContent={slidesContent}
          setSlidesContent={setSlidesContent}
          unsavedSlidesContent={unsavedSlidesContent}
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
          wpUrl={wpUrl}
          setWpUrl={setWpUrl}
          wpLoading={wpLoading}
          wpError={wpError}
          setWpError={setWpError}
          importWithContent={importWithContent}
          setImportWithContent={setImportWithContent}
          onWordPressImport={handleWordPressImport}
          onImageUpload={handleImageUpload}
          onDownload={handleDownload}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          stagesRef={stagesRef}
        />
      </>
    );
  }

  // Desktop layout
  return (
    <>
      <div className={styles.header}>
        <ThemeToggle />
      </div>
      <div className={styles.container}>
        <div className={styles.col + " " + styles.result}>
          <div className={styles.canvasContainer} ref={ref}>
            {currentSlide > 0 ? (
              <button
                className={styles.canvasOverlay + " " + styles.canvasPrev}
                onClick={() => setCurrentSlide(currentSlide - 1)}
              >
                &lt;
              </button>
            ) : null}
            {currentSlide <
            1 + slidesContent.length - 1 + (subForMore ? 1 : 0) ? (
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
              slidesContent={slidesContent}
              subForMore={subForMore}
              numero={numero}
              currentSlide={currentSlide}
              scale={scale}
              width={colWidth}
              onImgXChange={setImgX}
              stagesRef={stagesRef}
            />
          </div>

          <button onClick={handleDownload}>Télécharger</button>
        </div>
        <div className={styles.col + " " + styles.controls}>
          <div className={styles.importSection}>
            <label>Importer depuis WordPress</label>
            <div className={styles.importRow}>
              <input
                type="url"
                placeholder="URL de l'article"
                value={wpUrl}
                onChange={(e) => {
                  setWpUrl(e.target.value);
                  setWpError(null);
                }}
              />
              <button onClick={handleWordPressImport} disabled={wpLoading}>
                {wpLoading ? "..." : "Importer"}
              </button>
            </div>
            {wpError && <div className={styles.importError}>{wpError}</div>}
            <div className="input-group">
              <label htmlFor="importWithContent">
                <input
                  type="checkbox"
                  id="importWithContent"
                  checked={importWithContent}
                  onChange={(e) => setImportWithContent(e.target.checked)}
                />
                Importer le contenu de l&apos;article
              </label>
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="format">Format {unsavedFormat ? "⏳" : null}</label>
            <select
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
            >
              <option value="post">Post (4:5)</option>
              <option value="story">Story (9:16)</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="rubrique">
              Rubrique {unsavedRubrique ? "⏳" : null}
            </label>
            <select
              name="rubrique"
              value={rubrique}
              onChange={(e) => setRubrique(e.target.value)}
            >
              <option value="édito">Édito</option>
              <option value="actu">Actu</option>
              <option value="ailleurs">Ailleurs</option>
              <option value="pop !">Pop !</option>
              <option value="comprendre">Comprendre</option>
              <option value="dossier">Dossier</option>
              <option value="au cas où">Au cas où</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="image">Image</label>
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                if (e.target.files?.[0]) {
                  setImgDataUrl(await resizeImage(e.target.files[0]));
                }
              }}
            />
          </div>
          <div className="input-group">
            <label htmlFor="title">Titre {unsavedTitle ? "⏳" : null}</label>
            <input
              name="title"
              type="text"
              value={title}
              className={unsavedTitle ? styles.unsavedInput : ""}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="intro">Intro {unsavedIntro ? "⏳" : null}</label>
            <textarea
              rows={4}
              name="intro"
              value={intro}
              className={unsavedIntro ? styles.unsavedInput : ""}
              onChange={(e) => setIntro(e.target.value)}
            />
          </div>
          <div
            onChange={(e) =>
              setPosition(
                (e.target as HTMLInputElement).value as "top" | "bottom",
              )
            }
          >
            <input
              type="radio"
              id="top"
              name="position"
              value="top"
              defaultChecked={position === "top"}
            />
            <label htmlFor="top">En haut</label>
            <input
              type="radio"
              id="bottom"
              name="position"
              value="bottom"
              defaultChecked={position === "bottom"}
            />
            <label htmlFor="bottom">
              En bas {unsavedPosition ? "⏳" : null}
            </label>
          </div>
          <div className="input-group">
            <label htmlFor="subscribeformore">
              <input
                type="checkbox"
                id="subscribeformore"
                defaultChecked={subForMore}
                onChange={(e) => setSubForMore(e.target.checked)}
              />
              Ajouter la slide « Abonne-toi pour lire la suite »{" "}
              {unsavedSubForMore ? "⏳" : null}
            </label>
          </div>
          {subForMore ? (
            <div className="input-group">
              <label htmlFor="numero">Numéro</label>
              <input
                type="text"
                id="numero"
                className={unsavedNumero ? styles.unsavedInput : ""}
                value={numero}
                maxLength={2}
                onChange={(e) =>
                  !isNaN(Number(e.target.value)) &&
                  (Number(e.target.value) || e.target.value === "") &&
                  setNumero(Number(e.target.value))
                }
              />
            </div>
          ) : null}
          <div className="input-group">
            <label htmlFor="legendContent">
              Légende {unsavedLegendContent ? "⏳" : null}
            </label>
            <textarea
              rows={3}
              name="legendContent"
              value={legendContent}
              className={unsavedLegendContent ? styles.unsavedInput : ""}
              onChange={(e) => setLegendContent(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="imageCaption">
              Crédit image {unsavedImageCaption ? "⏳" : null}
            </label>
            <input
              type="text"
              name="imageCaption"
              value={imageCaption || ""}
              className={unsavedImageCaption ? styles.unsavedInput : ""}
              onChange={(e) => setImageCaption(e.target.value || null)}
            />
          </div>
          <LegendGenerator
            legendContent={legendContent}
            imageCaption={imageCaption}
            articleUrl={articleUrl}
          />
        </div>
        <div className={styles.col + " " + styles.controls}>
          <SlideContentEditor
            value={slidesContent}
            onChange={setSlidesContent}
            unsaved={unsavedSlidesContent}
          />
        </div>
      </div>
    </>
  );
}
