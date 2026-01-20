"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./SlideContentEditor.module.css";
import EditMode from "./EditMode";
import CutCopyMode from "./CutCopyMode";

// Internal state: store full text + cut character positions
interface EditorState {
  fullText: string;
  cutPositions: number[];
}

// Convert internal state to slidesContent array for saving
function toSlidesContent(state: EditorState): string[] {
  const { fullText, cutPositions } = state;

  if (!fullText.trim()) {
    return [];
  }

  if (cutPositions.length === 0) {
    return [fullText];
  }

  const slides: string[] = [];
  let lastPos = 0;

  for (const pos of cutPositions) {
    const slice = fullText.slice(lastPos, pos);
    if (slice.trim()) {
      slides.push(slice);
    }
    lastPos = pos;
  }

  const lastSlice = fullText.slice(lastPos);
  if (lastSlice.trim()) {
    slides.push(lastSlice);
  }

  return slides;
}

// Convert slidesContent array to internal state when loading
function fromSlidesContent(slides: string[]): EditorState {
  if (slides.length === 0) {
    return { fullText: "", cutPositions: [] };
  }

  if (slides.length === 1) {
    return { fullText: slides[0], cutPositions: [] };
  }

  // Join slides with a special separator that we'll use to determine cut positions
  // Since we're joining, we need to track where each slide ends
  const cutPositions: number[] = [];
  let position = 0;

  for (let i = 0; i < slides.length - 1; i++) {
    position += slides[i].length;
    cutPositions.push(position);
  }

  return {
    fullText: slides.join(""),
    cutPositions,
  };
}

type Mode = "edit" | "cutcopy";

interface SlideContentEditorProps {
  value: string[];
  onChange: (value: string[]) => void;
  unsaved: boolean;
}

export default function SlideContentEditor({
  value,
  onChange,
  unsaved,
}: SlideContentEditorProps) {
  const [mode, setMode] = useState<Mode>("edit");
  const [internalState, setInternalState] = useState<EditorState>(() =>
    fromSlidesContent(value),
  );

  // Sync from external value when it changes (e.g., initial load)
  useEffect(() => {
    setInternalState(fromSlidesContent(value));
  }, [value]);

  // Handle text changes in edit mode
  const handleTextChange = useCallback(
    (newText: string) => {
      const oldText = internalState.fullText;
      const oldCuts = internalState.cutPositions;

      // Find where the edit occurred by comparing old and new text
      // Find common prefix length
      let prefixLen = 0;
      while (
        prefixLen < oldText.length &&
        prefixLen < newText.length &&
        oldText[prefixLen] === newText[prefixLen]
      ) {
        prefixLen++;
      }

      // Find common suffix length (from the end)
      let suffixLen = 0;
      while (
        suffixLen < oldText.length - prefixLen &&
        suffixLen < newText.length - prefixLen &&
        oldText[oldText.length - 1 - suffixLen] ===
          newText[newText.length - 1 - suffixLen]
      ) {
        suffixLen++;
      }

      // The edit region in old text: [prefixLen, oldText.length - suffixLen)
      // The edit region in new text: [prefixLen, newText.length - suffixLen)
      const oldEditEnd = oldText.length - suffixLen;
      const newEditEnd = newText.length - suffixLen;
      const delta = newEditEnd - oldEditEnd; // positive = insertion, negative = deletion

      // Adjust cut positions
      const newCuts = oldCuts
        .map((pos) => {
          if (pos <= prefixLen) {
            // Cut is before the edit, unchanged
            return pos;
          } else if (pos >= oldEditEnd) {
            // Cut is after the edit region, shift by delta
            return pos + delta;
          } else {
            // Cut is inside the deleted/replaced region, remove it
            return -1;
          }
        })
        .filter((pos) => pos > 0 && pos < newText.length);

      const newState = {
        fullText: newText,
        cutPositions: newCuts,
      };

      setInternalState(newState);
      onChange(toSlidesContent(newState));
    },
    [internalState, onChange],
  );

  // Handle cut positions changes in cut/copy mode
  const handleCutPositionsChange = useCallback(
    (newCuts: number[]) => {
      const newState = {
        ...internalState,
        cutPositions: newCuts,
      };

      setInternalState(newState);
      onChange(toSlidesContent(newState));
    },
    [internalState, onChange],
  );

  return (
    <div className={styles.container}>
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeButton} ${mode === "edit" ? styles.active : ""}`}
          onClick={() => setMode("edit")}
        >
          Modifier {unsaved && mode === "edit" ? "⏳" : ""}
        </button>
        <button
          className={`${styles.modeButton} ${mode === "cutcopy" ? styles.active : ""}`}
          onClick={() => setMode("cutcopy")}
        >
          Couper/Copier {unsaved && mode === "cutcopy" ? "⏳" : ""}
        </button>
      </div>

      {mode === "edit" ? (
        <EditMode
          value={internalState.fullText}
          onChange={handleTextChange}
          unsaved={unsaved}
        />
      ) : (
        <CutCopyMode
          fullText={internalState.fullText}
          cutPositions={internalState.cutPositions}
          onCutPositionsChange={handleCutPositionsChange}
        />
      )}
    </div>
  );
}
