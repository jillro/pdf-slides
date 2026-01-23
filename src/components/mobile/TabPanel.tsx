"use client";

import styles from "./TabPanel.module.css";
import { ReactNode } from "react";

interface TabPanelProps {
  children: ReactNode;
}

export default function TabPanel({ children }: TabPanelProps) {
  return <div className={styles.panel}>{children}</div>;
}
