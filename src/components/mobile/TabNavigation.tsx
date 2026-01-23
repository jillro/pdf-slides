"use client";

import styles from "./TabNavigation.module.css";

export type TabId = "contenu" | "slides" | "image" | "partager";

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: "contenu", label: "Contenu", icon: "📝" },
  { id: "slides", label: "Slides", icon: "📑" },
  { id: "image", label: "Image", icon: "🖼️" },
  { id: "partager", label: "Partager", icon: "📤" },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  unsavedByTab: Record<TabId, boolean>;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  unsavedByTab,
}: TabNavigationProps) {
  return (
    <nav className={styles.tabBar}>
      {TABS.map((tab) => (
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
