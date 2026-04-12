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
  text: string;
}

let nextSectionId = 0;

function makeSection(text: string): Section {
  return { id: nextSectionId++, text };
}

function fromValue(slides: string[]): Section[] {
  if (slides.length === 0) return [makeSection("")];
  return slides.map(makeSection);
}

function toValue(sections: Section[]): string[] {
  return sections.map((s) => s.text).filter((t) => t.trim().length > 0);
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
    (index: number, newText: string) => {
      setSections((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], text: newText };
        onChange(toValue(next));
        return next;
      });
    },
    [onChange],
  );

  const handleSplit = useCallback(
    (index: number, cursorPos: number) => {
      setSections((prev) => {
        const text = prev[index].text;
        const before = { ...prev[index], text: text.slice(0, cursorPos) };
        const after = makeSection(text.slice(cursorPos));
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
        const merged = {
          ...prevSection,
          text: prevSection.text + curSection.text,
        };
        const next = [...prev];
        next.splice(index - 1, 2, merged);
        onChange(toValue(next));
        pendingFocus.current = {
          index: index - 1,
          cursorPos: prevSection.text.length,
        };
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
      const text = sections[index]?.text.trim();
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
            value={section.text}
            onChange={(newText) => handleSectionChange(i, newText)}
            onSplit={(cursorPos) => handleSplit(i, cursorPos)}
            onMergeWithPrevious={() => handleMergeWithPrevious(i)}
            onCopy={() => handleCopy(i)}
            textareaRef={(el) => {
              sectionRefs.current[i] = el;
            }}
            isFirst={i === 0}
            isTouchDevice={isTouchDevice}
            unsaved={unsaved}
          />
        </div>
      ))}
      <p className={styles.hint}>
        {isTouchDevice
          ? "Touchez pour placer le curseur, puis « Couper ici »"
          : "Clic droit : couper ici"}
      </p>
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
