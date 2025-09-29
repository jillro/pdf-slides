"use client";

import styles from "./AppView.module.css";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamicImport from "next/dynamic";
import JSZip from "jszip";
import useImage from "use-image";
import { useInterval, useResizeObserver } from "usehooks-ts";

import { Post, savePost } from "../app/storage";

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

  // Scale down the image to 1350 height, keeping the aspect ratio
  const canvas = document.createElement("canvas");
  canvas.height = 1350;
  canvas.width = (1350 * img.width) / img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  console.log(canvas.toDataURL());
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
  const [numero, unsavedNumero, setNumero] = useSavedState("numero", 1);
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

  const scale = colWidth ? colWidth / 1080 : 0;

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

  return (
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
            position={position}
            rubrique={rubrique}
            title={title}
            intro={intro}
            scale={scale}
            width={colWidth}
            ref={(el) => {
              if (el) {
                stagesRef.current[0] = el;
              }
            }}
            display={currentSlide === 0}
          />
          {slidesContent.map((content, i) => (
            <ContentSlide
              key={i}
              img={img}
              rubrique={rubrique}
              content={content}
              scale={scale}
              width={colWidth}
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
              numero={numero}
              scale={scale}
              width={colWidth}
              ref={(el) => {
                if (el) {
                  stagesRef.current[0] = el;
                }
              }}
              display={currentSlide === slidesContent.length + 1}
            />
          ) : null}
        </div>

        <button onClick={handleDownload}>Télécharger</button>
      </div>
      <div className={styles.col + " " + styles.controls}>
        <div className="input-group">
          <label htmlFor="rubrique">
            Rubrique {unsavedRubrique ? "⏳" : null}
          </label>
          <select name="rubrique" onChange={(e) => setRubrique(e.target.value)}>
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
          <label htmlFor="title">Rubrique {unsavedTitle ? "⏳" : null}</label>
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
          <label htmlFor="bottom">En bas {unsavedPosition ? "⏳" : null}</label>
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
      </div>
      <div className={styles.col + " " + styles.controls}>
        <div className="input-group">
          {[...slidesContent, ""].map(
            (slideContent, i, slidesContentPlusNew) => (
              <textarea
                key={i}
                rows={7}
                value={slideContent}
                className={unsavedSlidesContent ? styles.unsavedInput : ""}
                onChange={(e) => {
                  setSlidesContent(
                    slidesContentPlusNew
                      .map((s, j) => (j === i ? e.target.value : s))
                      .filter(
                        (s, j) =>
                          j < slidesContentPlusNew.length - 2 || !!s.length,
                      ),
                  );
                }}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
