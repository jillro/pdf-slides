"use client";

import styles from "./MobileLayout.module.css";
import { useState } from "react";
import TabNavigation, { TabId, computeUnsavedByTab } from "./TabNavigation";
import TabPanel from "./TabPanel";
import CanvasPreview from "./CanvasPreview";
import CanvasFocusMode from "./CanvasFocusMode";
import ContenuTab from "../tabs/ContenuTab";
import FormatTab from "../tabs/FormatTab";
import PartagerTab from "../tabs/PartagerTab";
import { slideCount } from "../../lib/slides";
import { usePostEditor } from "../PostEditorContext";

export default function MobileLayout() {
  const { post, unsaved } = usePostEditor();
  const [activeTab, setActiveTab] = useState<TabId>("contenu");
  const [focusModeOpen, setFocusModeOpen] = useState(false);

  const unsavedByTab = computeUnsavedByTab(unsaved);

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
        {activeTab === "format" && <FormatTab />}
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
