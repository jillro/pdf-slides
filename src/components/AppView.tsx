"use client";

import styles from "./AppView.module.css";

import { useEffect, useRef, useState } from "react";
import dynamicImport from "next/dynamic";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import useImage from "use-image";
import { useResizeObserver } from "usehooks-ts";

import { Post, savePost } from "../app/storage";

const FisrtSlide = dynamicImport(() => import("../components/FirstSlide"), {
  ssr: false,
});
const ContentSlide = dynamicImport(() => import("../components/ContentSlide"), {
  ssr: false,
});

async function imgDataUrl(imgUrl: string): Promise<string> {
  let blob = await fetch(imgUrl).then((r) => r.blob());

  return await new Promise((resolve) => {
    let reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function AppView(params: { post: Post }) {
  const init = params.post;
  const [imgUrl, setImgUrl] = useState<string>(init.img || "");
  const [img] = useImage(imgUrl, "anonymous");
  const ref = useRef<HTMLDivElement>(null);

  const { width: colWidth } = useResizeObserver({
    ref,
    box: "content-box",
  });

  const [title, setTitle] = useState<string>(init.title || "");
  const [intro, setIntro] = useState<string>(init.intro || "");
  const [rubrique, setRubrique] = useState<string>(init.rubrique || "édito");
  const [slidesContent, setSlidesContent] = useState<string[]>(
    init.slidesContent || [],
  );
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [position, setPosition] = useState<"top" | "bottom">("top");

  useEffect(() => {
    (async () => {
      await savePost({
        id: params.post.id,
        img: imgUrl ? await imgDataUrl(imgUrl) : null,
        title,
        intro,
        rubrique,
        slidesContent,
        position,
      });
    })();
  }, [imgUrl, title, intro, rubrique, slidesContent, position]);

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
          {currentSlide < 1 + slidesContent.length - 1 ? (
            <button
              className={styles.canvasOverlay + " " + styles.canvasNext}
              onClick={() => setCurrentSlide(currentSlide + 1)}
            >
              &gt;
            </button>
          ) : null}

          <FisrtSlide
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
            />
          ))}
        </div>
      </div>
      <div className={styles.col + " " + styles.controls}>
        <div className="input-group">
          <label htmlFor="rubrique">Rubrique</label>
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
                setImgUrl(URL.createObjectURL(e.target.files[0]));
              }
            }}
          />
        </div>
        <div className="input-group">
          <label htmlFor="title">Titre</label>
          <input
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="intro">Intro</label>
          <textarea
            rows={4}
            name="intro"
            value={intro}
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
          <label htmlFor="bottom">En bas</label>
        </div>
        <button onClick={handleDownload}>Télécharger</button>
      </div>
      <div className={styles.col + " " + styles.controls}>
        <div className="input-group">
          {[...slidesContent, ""].map(
            (slideContent, i, slidesContentPlusNew) => (
              <textarea
                key={i}
                rows={7}
                value={slideContent}
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
