"use client";

import { useRef, useCallback, useState } from "react";
import styles from "./SlideContentEditor.module.css";
import { useAutoResize } from "./useAutoResize";
import {
  CONTENT_BG_THEMES,
  CONTENT_BG_THEME_IDS,
  type ContentBgThemeId,
} from "../../lib/contentBgThemes";

interface SectionTextareaProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onSplit: (cursorPos: number) => void;
  onMergeWithPrevious: () => void;
  onCopy: () => void;
  textareaRef: (el: HTMLTextAreaElement | null) => void;
  isFirst: boolean;
  isTouchDevice: boolean;
  themeId: ContentBgThemeId;
  onThemeChange: (themeId: ContentBgThemeId) => void;
}

export default function SectionTextarea({
  index,
  value,
  onChange,
  onSplit,
  onMergeWithPrevious,
  onCopy,
  textareaRef,
  isFirst,
  isTouchDevice,
  themeId,
  onThemeChange,
}: SectionTextareaProps) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const [showMobileCut, setShowMobileCut] = useState(false);

  useAutoResize(localRef, value);

  const setRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      localRef.current = el;
      textareaRef(el);
    },
    [textareaRef],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isTouchDevice) return;
      e.preventDefault();
      const textarea = localRef.current;
      if (!textarea) return;
      const pos = textarea.selectionStart;
      if (pos > 0 && pos < value.length) {
        onSplit(pos);
      }
    },
    [isTouchDevice, value, onSplit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !isFirst) {
        const textarea = localRef.current;
        if (
          textarea &&
          textarea.selectionStart === 0 &&
          textarea.selectionEnd === 0
        ) {
          e.preventDefault();
          onMergeWithPrevious();
        }
      }
    },
    [isFirst, onMergeWithPrevious],
  );

  const handleFocus = useCallback(() => {
    if (isTouchDevice) {
      setShowMobileCut(true);
    }
  }, [isTouchDevice]);

  const handleBlur = useCallback(() => {
    // Delay to allow mobile cut button click to fire first
    setTimeout(() => setShowMobileCut(false), 200);
  }, []);

  const handleMobileCut = useCallback(() => {
    const textarea = localRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    if (pos > 0 && pos < value.length) {
      onSplit(pos);
    }
  }, [onSplit, value.length]);

  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionBadge}>{index + 1}</span>
        {isTouchDevice && showMobileCut && (
          <button
            className={styles.mobileCutButton}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMobileCut}
          >
            Couper ici
          </button>
        )}
        <select
          className={styles.sectionThemeSelect}
          value={themeId}
          onChange={(e) => onThemeChange(e.target.value as ContentBgThemeId)}
          title="Fond de la slide"
          aria-label="Fond de la slide"
        >
          {CONTENT_BG_THEME_IDS.map((id) => (
            <option key={id} value={id}>
              {CONTENT_BG_THEMES[id].label}
            </option>
          ))}
        </select>
        <button
          className={styles.copyButton}
          onClick={onCopy}
          title="Copier le texte de cette section"
        >
          ⎘
        </button>
      </div>
      <div className={styles.textareaWrapper}>
        <textarea
          ref={setRef}
          className={styles.sectionTextarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onContextMenu={handleContextMenu}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={index === 0 ? "Collez votre texte ici..." : ""}
          title={isTouchDevice ? undefined : "Clic droit : couper ici"}
        />
      </div>
    </div>
  );
}
