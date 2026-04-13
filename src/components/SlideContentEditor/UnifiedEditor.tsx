"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./SlideContentEditor.module.css";
import SectionTextarea from "./SectionTextarea";
import CutMarker from "./CutMarker";
import {
  DEFAULT_CONTENT_BG_THEME,
  type ContentBgThemeId,
} from "../../lib/contentBgThemes";

interface UnifiedEditorProps {
  value: string[];
  slideThemes: ContentBgThemeId[];
  onChange: (value: string[], slideThemes: ContentBgThemeId[]) => void;
  unsaved: boolean;
}

interface Section {
  id: number;
  // Hidden leading/trailing whitespace, preserved in memory so that removing
  // a cut restores the original interior whitespace between sections.
  // Never sent to onChange and never shown in the textarea.
  leading: string;
  body: string;
  trailing: string;
  themeId: ContentBgThemeId;
}

let nextSectionId = 0;

function splitWhitespace(text: string): {
  leading: string;
  body: string;
  trailing: string;
} {
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const rest = text.slice(leading.length);
  const trailing = rest.match(/\s*$/)?.[0] ?? "";
  const body = rest.slice(0, rest.length - trailing.length);
  return { leading, body, trailing };
}

function makeSectionFromText(
  text: string,
  themeId: ContentBgThemeId,
): Section {
  return { id: nextSectionId++, ...splitWhitespace(text), themeId };
}

function sectionFullText(s: Section): string {
  return s.leading + s.body + s.trailing;
}

function fromValue(
  slides: string[],
  themes: ContentBgThemeId[],
): Section[] {
  if (slides.length === 0) {
    return [makeSectionFromText("", DEFAULT_CONTENT_BG_THEME)];
  }
  return slides.map((s, i) =>
    makeSectionFromText(s, themes[i] ?? DEFAULT_CONTENT_BG_THEME),
  );
}

// Saved slides are always trimmed — hidden whitespace stays internal only.
// Empty bodies are dropped, and the themes array is filtered in lockstep.
function toValueAndThemes(
  sections: Section[],
): { value: string[]; themes: ContentBgThemeId[] } {
  const value: string[] = [];
  const themes: ContentBgThemeId[] = [];
  for (const s of sections) {
    const trimmed = s.body.trim();
    if (trimmed.length === 0) continue;
    value.push(trimmed);
    themes.push(s.themeId);
  }
  return { value, themes };
}

export default function UnifiedEditor({
  value,
  slideThemes,
  onChange,
  unsaved,
}: UnifiedEditorProps) {
  const [sections, setSections] = useState<Section[]>(() =>
    fromValue(value, slideThemes),
  );
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const sectionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Track a pending focus request after split/merge
  const pendingFocus = useRef<{
    index: number;
    cursorPos: number;
  } | null>(null);

  const commit = useCallback(
    (next: Section[]) => {
      setSections(next);
      const { value, themes } = toValueAndThemes(next);
      onChange(value, themes);
    },
    [onChange],
  );

  // Sync from parent when value or themes change externally (e.g. WordPress
  // import or a remote save catching up).
  useEffect(() => {
    const derived = toValueAndThemes(sections);
    const sameValue = derived.value.join("\0") === value.join("\0");
    const sameThemes = derived.themes.join("\0") === slideThemes.join("\0");
    if (!sameValue || !sameThemes) {
      setSections(fromValue(value, slideThemes));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, slideThemes]);

  // Apply pending focus after sections change (split/merge)
  useEffect(() => {
    if (pendingFocus.current) {
      const { index, cursorPos } = pendingFocus.current;
      pendingFocus.current = null;
      requestAnimationFrame(() => {
        const textarea = sectionRefs.current[index];
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(cursorPos, cursorPos);
        }
      });
    }
  }, [sections]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleSectionChange = useCallback(
    (index: number, newBody: string) => {
      const next = [...sections];
      next[index] = { ...next[index], body: newBody };
      commit(next);
    },
    [sections, commit],
  );

  const handleThemeChange = useCallback(
    (index: number, themeId: ContentBgThemeId) => {
      const next = [...sections];
      next[index] = { ...next[index], themeId };
      commit(next);
    },
    [sections, commit],
  );

  const handleSplit = useCallback(
    (index: number, cursorPos: number) => {
      const current = sections[index];
      const bodyBefore = current.body.slice(0, cursorPos);
      const bodyAfter = current.body.slice(cursorPos);

      // Trim whitespace at the new internal boundary: move trailing
      // whitespace of bodyBefore into section A's trailing, and leading
      // whitespace of bodyAfter into section B's leading.
      const aBodyTrimmed = bodyBefore.trimEnd();
      const aExtraTrailing = bodyBefore.slice(aBodyTrimmed.length);
      const bBodyTrimmed = bodyAfter.trimStart();
      const bExtraLeading = bodyAfter.slice(
        0,
        bodyAfter.length - bBodyTrimmed.length,
      );

      const before: Section = {
        ...current,
        body: aBodyTrimmed,
        trailing: aExtraTrailing,
      };
      const after: Section = {
        id: nextSectionId++,
        leading: bExtraLeading,
        body: bBodyTrimmed,
        trailing: current.trailing,
        themeId: current.themeId,
      };

      const next = [...sections];
      next.splice(index, 1, before, after);
      pendingFocus.current = { index: index + 1, cursorPos: 0 };
      commit(next);
    },
    [sections, commit],
  );

  const handleMergeWithPrevious = useCallback(
    (index: number) => {
      if (index === 0) return;
      const prevSection = sections[index - 1];
      const curSection = sections[index];
      // Concatenate full text (with hidden whitespace) and re-derive
      // leading/body/trailing. The previously-hidden boundary whitespace
      // becomes interior whitespace of the merged body, making it visible.
      const mergedFull =
        sectionFullText(prevSection) + sectionFullText(curSection);
      const parts = splitWhitespace(mergedFull);
      // Left wins: merged section keeps the previous section's theme.
      const merged: Section = {
        id: prevSection.id,
        ...parts,
        themeId: prevSection.themeId,
      };

      // Cursor = position in new body corresponding to the old end of
      // prevSection.body in the merged full text.
      const oldEndInFull =
        prevSection.leading.length + prevSection.body.length;
      const cursorPos = Math.max(0, oldEndInFull - parts.leading.length);

      const next = [...sections];
      next.splice(index - 1, 2, merged);
      pendingFocus.current = { index: index - 1, cursorPos };
      commit(next);
    },
    [sections, commit],
  );

  const handleRemoveCut = useCallback(
    (cutIndex: number) => {
      // cutIndex is the index of the cut marker (0-based), which sits between
      // section cutIndex and section cutIndex+1
      const sectionIndex = cutIndex + 1;
      handleMergeWithPrevious(sectionIndex);
    },
    [handleMergeWithPrevious],
  );

  const handleCopy = useCallback(
    async (index: number) => {
      const text = sections[index]?.body.trim();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copié !");
      } catch {
        showToast("Erreur de copie");
      }
    },
    [sections, showToast],
  );

  const handleTouchStart = useCallback(() => {
    if (!isTouchDevice) setIsTouchDevice(true);
  }, [isTouchDevice]);

  return (
    <div className={styles.unifiedContainer} onTouchStart={handleTouchStart}>
      {sections.map((section, i) => (
        <div key={section.id}>
          {i > 0 && <CutMarker onRemove={() => handleRemoveCut(i - 1)} />}
          <SectionTextarea
            index={i}
            value={section.body}
            onChange={(newText) => handleSectionChange(i, newText)}
            onSplit={(cursorPos) => handleSplit(i, cursorPos)}
            onMergeWithPrevious={() => handleMergeWithPrevious(i)}
            onCopy={() => handleCopy(i)}
            textareaRef={(el) => {
              sectionRefs.current[i] = el;
            }}
            isFirst={i === 0}
            isTouchDevice={isTouchDevice}
            themeId={section.themeId}
            onThemeChange={(themeId) => handleThemeChange(i, themeId)}
          />
        </div>
      ))}
      <div className={styles.hintRow}>
        <p className={styles.hint}>
          {isTouchDevice
            ? "Touchez pour placer le curseur, puis « Couper ici »"
            : "Clic droit : couper ici"}
        </p>
        {unsaved && (
          <span
            className={styles.unsavedDot}
            aria-label="Modifications non enregistrées"
          />
        )}
      </div>
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
