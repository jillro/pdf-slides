"use client";

import styles from "./AppView.module.css";

import { useCallback, useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import dynamicImport from "next/dynamic";
import SlideContentEditor from "./SlideContentEditor/SlideContentEditor";
import JSZip from "jszip";
import useImage from "use-image";
import { useInterval, useResizeObserver } from "usehooks-ts";

import { Post, savePost } from "../app/storage";
import { importFromWordPress } from "../app/wordpress";
import { Format, FORMAT_DIMENSIONS, MAX_FORMAT_HEIGHT } from "../lib/formats";

const FirstSlide = dynamicImport(() => import("../components/FirstSlide"), {
  ssr: false,
});
const ContentSlide = dynamicImport(() => import("../components/ContentSlide"), {
  ssr: false,
});
const SubForMoreSlide = dynamicImport(
  () => import("../components/SubForMoreSlide"),
  { ssr: false },
);

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
  const [imgDataUrl, setImgDataUrl] = useState<string>(init.img || "");
  const [img] = useImage(imgDataUrl, "anonymous");
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

  const { width: canvasWidth, height: canvasHeight } =
    FORMAT_DIMENSIONS[format];
  const scale = colWidth ? colWidth / canvasWidth : 0;

  const stagesRef = useRef([]);
  const handleDownload = async () => {
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
    } = result.data;

    setTitle(importedTitle);
    if (importWithContent) {
      setSlidesContent([content]);
    }

    if (importedRubrique) {
      setRubrique(importedRubrique);
    }

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

            <FirstSlide
              img={img}
              imgX={imgX}
              position={position}
              rubrique={rubrique}
              title={title}
              intro={intro}
              scale={scale}
              width={colWidth}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              ref={(el) => {
                if (el) {
                  stagesRef.current[0] = el;
                }
              }}
              display={currentSlide === 0}
              onImgXChange={setImgX}
            />
            {slidesContent.map((content, i) => (
              <ContentSlide
                key={i}
                img={img}
                imgX={imgX}
                rubrique={rubrique}
                content={content}
                scale={scale}
                width={colWidth}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                ref={(el) => {
                  if (el) {
                    stagesRef.current[i + 1] = el;
                  }
                }}
                display={i + 1 === currentSlide}
                last={i + 1 === slidesContent.length}
              />
            ))}
            {subForMore ? (
              <SubForMoreSlide
                img={img}
                imgX={imgX}
                numero={numero}
                scale={scale}
                width={colWidth}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                ref={(el) => {
                  if (el) {
                    stagesRef.current[slidesContent.length + 1] = el;
                  }
                }}
                display={currentSlide === slidesContent.length + 1}
              />
            ) : null}
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
