"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./SlideContentEditor.module.css";
import SectionTextarea from "./SectionTextarea";
import CutMarker from "./CutMarker";

interface UnifiedEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
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

function makeSectionFromText(text: string): Section {
  return { id: nextSectionId++, ...splitWhitespace(text) };
}

function sectionFullText(s: Section): string {
  return s.leading + s.body + s.trailing;
}

function fromValue(slides: string[]): Section[] {
  if (slides.length === 0) return [makeSectionFromText("")];
  return slides.map(makeSectionFromText);
}

// Saved slides are always trimmed — hidden whitespace stays internal only.
function toValue(sections: Section[]): string[] {
  return sections.map((s) => s.body.trim()).filter((t) => t.length > 0);
}

export default function UnifiedEditor({
  value,
  onChange,
  unsaved,
}: UnifiedEditorProps) {
  const [sections, setSections] = useState<Section[]>(() => fromValue(value));
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const sectionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Track a pending focus request after split/merge
  const pendingFocus = useRef<{
    index: number;
    cursorPos: number;
  } | null>(null);

  // Sync from parent when value changes externally (e.g. WordPress import)
  useEffect(() => {
    const currentValue = toValue(sections);
    if (currentValue.join("\0") !== value.join("\0")) {
      setSections(fromValue(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
      setSections((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], body: newBody };
        onChange(toValue(next));
        return next;
      });
    },
    [onChange],
  );

  const handleSplit = useCallback(
    (index: number, cursorPos: number) => {
      setSections((prev) => {
        const current = prev[index];
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
        };

        const next = [...prev];
        next.splice(index, 1, before, after);
        onChange(toValue(next));
        pendingFocus.current = { index: index + 1, cursorPos: 0 };
        return next;
      });
    },
    [onChange],
  );

  const handleMergeWithPrevious = useCallback(
    (index: number) => {
      if (index === 0) return;
      setSections((prev) => {
        const prevSection = prev[index - 1];
        const curSection = prev[index];
        // Concatenate full text (with hidden whitespace) and re-derive
        // leading/body/trailing. The previously-hidden boundary whitespace
        // becomes interior whitespace of the merged body, making it visible.
        const mergedFull =
          sectionFullText(prevSection) + sectionFullText(curSection);
        const parts = splitWhitespace(mergedFull);
        const merged: Section = {
          id: prevSection.id,
          ...parts,
        };

        // Cursor = position in new body corresponding to the old end of
        // prevSection.body in the merged full text.
        const oldEndInFull =
          prevSection.leading.length + prevSection.body.length;
        const cursorPos = Math.max(0, oldEndInFull - parts.leading.length);

        const next = [...prev];
        next.splice(index - 1, 2, merged);
        onChange(toValue(next));
        pendingFocus.current = { index: index - 1, cursorPos };
        return next;
      });
    },
    [onChange],
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
