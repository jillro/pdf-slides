"use client";

import styles from "./TabNavigation.module.css";
import { Post } from "../../app/storage";

export type TabId = "contenu" | "format" | "partager";

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: "contenu", label: "Contenu", icon: "📝" },
  { id: "format", label: "Format", icon: "🖼️" },
  { id: "partager", label: "Partager", icon: "📤" },
];

// Shared by both layouts so the unsaved dots stay identical across devices.
export function computeUnsavedByTab(
  unsaved: Partial<Post>,
): Record<TabId, boolean> {
  return {
    contenu:
      "title" in unsaved ||
      "intro" in unsaved ||
      "rubrique" in unsaved ||
      "slidesContent" in unsaved,
    format:
      "format" in unsaved ||
      "position" in unsaved ||
      "firstSlideLayout" in unsaved,
    partager:
      "subForMore" in unsaved ||
      "numero" in unsaved ||
      "legendContent" in unsaved ||
      "imageCaption" in unsaved,
  };
}

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  unsavedByTab: Record<TabId, boolean>;
  variant?: "bottom" | "top";
  tabs?: TabId[];
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  unsavedByTab,
  variant = "bottom",
  tabs,
}: TabNavigationProps) {
  const visibleTabs = tabs ? TABS.filter((t) => tabs.includes(t.id)) : TABS;

  return (
    <nav className={`${styles.tabBar} ${variant === "top" ? styles.top : ""}`}>
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
          onClick={() => onTabChange(tab.id)}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>
            {tab.label}
            {unsavedByTab[tab.id] && <span className={styles.unsavedDot} />}
          </span>
        </button>
      ))}
    </nav>
  );
}
