import "./App.css";
import { useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import { useResizeObserver } from "usehooks-ts";
import useImage from "use-image";
import JSZip from "jszip";

import { FisrtSlide } from "./components/FirstSlide.tsx";
import { ContentSlide } from "./components/ContentSlide.tsx";
import Konva from "konva";

function App() {
  const hash = window.location.hash.slice(1);
  const init = hash ? JSON.parse(decodeURIComponent(hash)) : {};
  const [imgUrl, setImgUrl] = useState<string>("");
  const [img] = useImage(imgUrl, "anonymous");
  const ref = useRef<HTMLDivElement>(null);

  const { width: colWidth } = useResizeObserver({
    // @ts-expect-error This works
    ref,
    box: "content-box",
  });

  const [title, setTitle] = useState<string>("title" in init ? init.title : "");
  const [intro, setIntro] = useState<string>("intro" in init ? init.intro : "");
  const [rubrique, setRubrique] = useState<string>(
    "rubrique" in init ? init.rubrique : "édito",
  );
  const [slidesContent, setSlidesContent] = useState<string[]>(
    "slidesContent" in init ? init.slidesContent : [],
  );
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [position, setPosition] = useState<"top" | "bottom">("top");

  useEffect(() => {
    window.location.hash = JSON.stringify({
      title,
      intro,
      rubrique,
      slidesContent,
      position,
    });
  }, [title, intro, rubrique, slidesContent, position]);

  const scale = colWidth ? colWidth / 1080 : 0;

  const stagesRef = useRef<Konva.Stage[]>([]);
  const handleDownload = async () => {
    const zip = new JSZip();
    await Promise.all(
      stagesRef.current.map(async (stage, i) => {
        zip.file(`${i}.png`, await stage.toBlob({ pixelRatio: 2 }));
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
    <div className="container">
      <div className="col result">
        <div className={"canvas-container"} ref={ref}>
          {currentSlide > 0 ? (
            <button
              className="canvas-overlay canvas-previous"
              onClick={() => setCurrentSlide(currentSlide - 1)}
            >
              &lt;
            </button>
          ) : null}
          {currentSlide < 1 + slidesContent.length - 1 ? (
            <button
              className="canvas-overlay canvas-next"
              onClick={() => setCurrentSlide(currentSlide + 1)}
            >
              &gt;
            </button>
          ) : null}

          <Stage
            scaleX={scale}
            scaleY={scale}
            width={colWidth}
            height={colWidth ? (colWidth * 1350) / 1080 : 0}
            ref={(el) => {
              if (el) {
                stagesRef.current[0] = el;
              }
            }}
            style={{ display: currentSlide === 0 ? "block" : "none" }}
          >
            <FisrtSlide
              img={img}
              position={position}
              rubrique={rubrique}
              title={title}
              intro={intro}
            />
          </Stage>
          {slidesContent.map((content, i) => (
            <Stage
              key={i}
              scaleX={scale}
              scaleY={scale}
              width={colWidth}
              height={colWidth ? (colWidth * 1350) / 1080 : 0}
              ref={(el) => {
                if (el) {
                  stagesRef.current[i + 1] = el;
                }
              }}
              style={{ display: i + 1 === currentSlide ? "block" : "none" }}
            >
              <ContentSlide img={img} rubrique={rubrique} content={content} />
            </Stage>
          ))}
        </div>
      </div>
      <div className="col content">
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
            checked={position === "top"}
          />
          <label htmlFor="top">En haut</label>
          <input
            type="radio"
            id="bottom"
            name="position"
            value="bottom"
            checked={position === "bottom"}
          />
          <label htmlFor="bottom">En bas</label>
        </div>
        <button onClick={handleDownload}>Télécharger</button>
      </div>
      <div className="col controls">
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

export default App;
