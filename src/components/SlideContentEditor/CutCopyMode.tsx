import React, { useState, useCallback, useRef } from "react";
import styles from "./SlideContentEditor.module.css";

interface CutCopyModeProps {
  fullText: string;
  cutPositions: number[];
  onCutPositionsChange: (positions: number[]) => void;
}

export default function CutCopyMode({
  fullText,
  cutPositions,
  onCutPositionsChange,
}: CutCopyModeProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse text into sections based on cut positions
  const sections = getSections(fullText, cutPositions);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  // Handle left-click on a section to copy
  const handleSectionClick = useCallback(
    async (sectionText: string) => {
      try {
        await navigator.clipboard.writeText(sectionText.trim());
        showToast("Copié !");
      } catch {
        showToast("Erreur de copie");
      }
    },
    [showToast],
  );

  // Add a cut at a position
  const addCut = useCallback(
    (position: number) => {
      // Avoid duplicate cuts
      if (cutPositions.includes(position)) return;

      const newPositions = [...cutPositions, position].sort((a, b) => a - b);
      onCutPositionsChange(newPositions);
    },
    [cutPositions, onCutPositionsChange],
  );

  // Handle mouse move to track hover position
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const charSpan = target.closest("[data-char-index]");
    if (charSpan) {
      setHoverPosition(Number(charSpan.getAttribute("data-char-index")));
    }
  }, []);

  // Handle mouse leave to clear hover position
  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  // Handle right-click to add a cut
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // Use hover position if available
      const cutPosition = hoverPosition;

      // Validate position
      if (
        cutPosition !== null &&
        cutPosition > 0 &&
        cutPosition < fullText.length
      ) {
        addCut(cutPosition);
      }
    },
    [hoverPosition, fullText, addCut],
  );

  // Remove a cut
  const removeCut = useCallback(
    (index: number) => {
      const newPositions = cutPositions.filter((_, i) => i !== index);
      onCutPositionsChange(newPositions);
    },
    [cutPositions, onCutPositionsChange],
  );

  // Touch detection handler
  const handleTouchStart = useCallback(() => {
    if (!isTouchDevice) setIsTouchDevice(true);
  }, [isTouchDevice]);

  // Character tap handler (mobile)
  const handleCharClick = useCallback(
    (e: React.MouseEvent, globalIndex: number) => {
      if (!isTouchDevice) return;
      e.stopPropagation();

      if (globalIndex <= 0 || globalIndex >= fullText.length) {
        setSelectedPosition(null);
        setTooltipAnchor(null);
        return;
      }

      const target = e.currentTarget as HTMLElement;
      setSelectedPosition(globalIndex);
      setTooltipAnchor(target.getBoundingClientRect());
    },
    [isTouchDevice, fullText.length],
  );

  // Tooltip cut confirmation handler
  const handleTooltipCut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedPosition !== null) {
        addCut(selectedPosition);
      }
      setSelectedPosition(null);
      setTooltipAnchor(null);
    },
    [selectedPosition, addCut],
  );

  // Tooltip dismissal handler
  const handleContainerClick = useCallback(() => {
    if (isTouchDevice && selectedPosition !== null) {
      setSelectedPosition(null);
      setTooltipAnchor(null);
    }
  }, [isTouchDevice, selectedPosition]);

  if (!fullText.trim()) {
    return (
      <div className={styles.cutCopyContainer}>
        <div className={styles.section} style={{ color: "#999" }}>
          Aucun texte. Passez en mode Modifier pour ajouter du contenu.
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={styles.cutCopyContainer}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onClick={handleContainerClick}
      >
        {sections.map((section, sectionIndex) => {
          const sectionStart = getSectionStart(cutPositions, sectionIndex);
          return (
            <div key={sectionIndex}>
              {sectionIndex > 0 && (
                <div className={styles.cutMarker}>
                  <button
                    className={styles.cutMarkerRemove}
                    onClick={() => removeCut(sectionIndex - 1)}
                    title="Supprimer cette coupure"
                  >
                    ×
                  </button>
                </div>
              )}
              <div
                className={styles.section}
                onClick={() => handleSectionClick(section)}
                onContextMenu={handleContextMenu}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                title="Clic gauche : copier | Clic droit : couper ici"
              >
                <span className={styles.sectionBadge}>{sectionIndex + 1}</span>
                <span className={styles.sectionText}>
                  {renderSectionChars(
                    section,
                    sectionStart,
                    hoverPosition,
                    selectedPosition,
                    handleCharClick,
                    styles,
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className={styles.hint}>
        {isTouchDevice
          ? 'Touchez pour placer le curseur, puis "Couper ici"'
          : "Clic gauche : copier | Clic droit : couper ici"}
      </p>
      {isTouchDevice && selectedPosition !== null && tooltipAnchor && (
        <div
          className={styles.cutTooltip}
          style={{
            left: tooltipAnchor.left + tooltipAnchor.width / 2,
            top: tooltipAnchor.top - 8,
          }}
        >
          <button
            className={styles.cutTooltipButton}
            onClick={handleTooltipCut}
          >
            Couper ici
          </button>
        </div>
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </>
  );
}

// Helper: get the start position of a section
function getSectionStart(cutPositions: number[], sectionIndex: number): number {
  if (sectionIndex === 0) return 0;
  return cutPositions[sectionIndex - 1];
}

// Helper: render section characters with highlight marker visualization
function renderSectionChars(
  section: string,
  sectionStart: number,
  hoverPosition: number | null,
  selectedPosition: number | null,
  handleCharClick: (e: React.MouseEvent, globalIndex: number) => void,
  styles: Record<string, string>,
) {
  const trimmed = section.trim();
  const trimOffset = section.length - section.trimStart().length;

  // Parse highlight markers within the trimmed text
  const parts: { text: string; isMarker: boolean; isHighlighted: boolean }[] =
    [];
  const regex = /==([^=]*)==/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(trimmed)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: trimmed.slice(lastIndex, match.index),
        isMarker: false,
        isHighlighted: false,
      });
    }
    // Opening ==
    parts.push({ text: "==", isMarker: true, isHighlighted: false });
    // Highlighted content
    parts.push({ text: match[1], isMarker: false, isHighlighted: true });
    // Closing ==
    parts.push({ text: "==", isMarker: true, isHighlighted: false });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < trimmed.length) {
    parts.push({
      text: trimmed.slice(lastIndex),
      isMarker: false,
      isHighlighted: false,
    });
  }

  const elements: React.ReactNode[] = [];
  let charOffset = 0;

  for (const part of parts) {
    for (let i = 0; i < part.text.length; i++) {
      const charIndex = charOffset + i;
      const globalIndex = sectionStart + trimOffset + charIndex;
      const char = part.text[i];

      let className = "";
      if (part.isMarker) className = styles.highlightMarker;
      else if (part.isHighlighted) className = styles.highlightedText;

      elements.push(
        <span
          key={charIndex}
          data-char-index={globalIndex}
          onClick={(e) => handleCharClick(e, globalIndex)}
          className={className || undefined}
        >
          {(hoverPosition === globalIndex ||
            selectedPosition === globalIndex) && (
            <span className={styles.cutCursor} />
          )}
          {char}
        </span>,
      );
    }
    charOffset += part.text.length;
  }

  return elements;
}

// Helper: split text into sections based on cut positions
function getSections(fullText: string, cutPositions: number[]): string[] {
  if (cutPositions.length === 0) {
    return [fullText];
  }

  const sections: string[] = [];
  let lastPos = 0;

  for (const pos of cutPositions) {
    sections.push(fullText.slice(lastPos, pos));
    lastPos = pos;
  }

  sections.push(fullText.slice(lastPos));

  return sections;
}
