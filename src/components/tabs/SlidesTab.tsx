"use client";

import styles from "./SlidesTab.module.css";
import SlideContentEditor from "../SlideContentEditor/SlideContentEditor";
import type { ContentBgThemeId } from "../../lib/contentBgThemes";

interface SlidesTabProps {
  slidesContent: string[];
  slideThemes: ContentBgThemeId[];
  onSlidesAndThemesChange: (
    value: string[],
    themes: ContentBgThemeId[],
  ) => void;
  unsavedSlidesContent: boolean;
}

export default function SlidesTab({
  slidesContent,
  slideThemes,
  onSlidesAndThemesChange,
  unsavedSlidesContent,
}: SlidesTabProps) {
  return (
    <div className={styles.container}>
      <SlideContentEditor
        value={slidesContent}
        slideThemes={slideThemes}
        onChange={onSlidesAndThemesChange}
        unsaved={unsavedSlidesContent}
      />
    </div>
  );
}
