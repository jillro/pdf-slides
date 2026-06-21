"use client";

import styles from "./TabPanel.module.css";
import { ReactNode } from "react";

interface TabPanelProps {
  children: ReactNode;
  variant?: "bottom" | "top";
}

export default function TabPanel({
  children,
  variant = "bottom",
}: TabPanelProps) {
  return (
    <div className={`${styles.panel} ${variant === "top" ? styles.top : ""}`}>
      {children}
    </div>
  );
}
