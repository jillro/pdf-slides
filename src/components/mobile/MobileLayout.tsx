"use client";

import styles from "./MobileLayout.module.css";
import { useState } from "react";
import TabNavigation, { TabId } from "./TabNavigation";
import TabPanel from "./TabPanel";
import CanvasPreview from "./CanvasPreview";
import CanvasFocusMode from "./CanvasFocusMode";
import ContenuTab from "../tabs/ContenuTab";
import SlidesTab from "../tabs/SlidesTab";
import ImageTab from "../tabs/ImageTab";
import PartagerTab from "../tabs/PartagerTab";
import { slideCount } from "../../lib/slides";
import { usePostEditor } from "../PostEditorContext";

export default function MobileLayout() {
  const { post, unsaved } = usePostEditor();
  const [activeTab, setActiveTab] = useState<TabId>("contenu");
  const [focusModeOpen, setFocusModeOpen] = useState(false);

  const unsavedByTab: Record<TabId, boolean> = {
    contenu: "title" in unsaved || "intro" in unsaved || "rubrique" in unsaved,
    slides: "slidesContent" in unsaved,
    image: "format" in unsaved || "position" in unsaved,
    partager:
      "subForMore" in unsaved ||
      "numero" in unsaved ||
      "legendContent" in unsaved ||
      "imageCaption" in unsaved,
  };

  // Total number of slides for preview
  const totalSlides = slideCount(post.slidesContent, post.subForMore);

  return (
    <div className={styles.mobileLayout}>
      <CanvasPreview
        totalSlides={totalSlides}
        onTap={() => setFocusModeOpen(true)}
      />

      <TabPanel>
        {activeTab === "contenu" && <ContenuTab />}
        {activeTab === "slides" && <SlidesTab />}
        {activeTab === "image" && <ImageTab />}
        {activeTab === "partager" && <PartagerTab />}
      </TabPanel>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unsavedByTab={unsavedByTab}
      />

      {focusModeOpen && (
        <CanvasFocusMode onClose={() => setFocusModeOpen(false)} />
      )}
    </div>
  );
}
