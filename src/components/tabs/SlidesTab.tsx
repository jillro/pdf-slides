"use client";

import styles from "./SlidesTab.module.css";
import SlideContentEditor from "../SlideContentEditor/SlideContentEditor";
import { usePostEditor, usePostField } from "../PostEditorContext";

export default function SlidesTab() {
  const [slidesContent, unsavedSlidesContent] = usePostField("slidesContent");
  const [slideThemes] = usePostField("slideThemes");
  const { setSlidesAndThemes } = usePostEditor();

  return (
    <div className={styles.container}>
      <SlideContentEditor
        value={slidesContent}
        slideThemes={slideThemes}
        onChange={setSlidesAndThemes}
        unsaved={unsavedSlidesContent}
      />
    </div>
  );
}
