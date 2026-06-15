"use client";

import styles from "./AppView.module.css";

import { useMediaQuery } from "usehooks-ts";
import ThemeToggle from "./ThemeToggle";
import { Post } from "../app/storage";
import { PostEditorProvider } from "./PostEditorContext";
import DesktopLayout from "./DesktopLayout";
import MobileLayout from "./mobile/MobileLayout";

export default function AppView({ post }: { post: Post }) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <PostEditorProvider post={post}>
      <div className={styles.header}>
        <ThemeToggle />
      </div>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </PostEditorProvider>
  );
}
