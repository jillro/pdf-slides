"use client";

import styles from "./SlidesTab.module.css";
import SlideContentEditor from "../SlideContentEditor/SlideContentEditor";

interface SlidesTabProps {
  slidesContent: string[];
  setSlidesContent: (value: string[]) => void;
  unsavedSlidesContent: boolean;
}

export default function SlidesTab({
  slidesContent,
  setSlidesContent,
  unsavedSlidesContent,
}: SlidesTabProps) {
  return (
    <div className={styles.container}>
      <SlideContentEditor
        value={slidesContent}
        onChange={setSlidesContent}
        unsaved={unsavedSlidesContent}
      />
    </div>
  );
}
