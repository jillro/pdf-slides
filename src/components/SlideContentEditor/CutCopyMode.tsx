import { useState, useCallback, useRef } from "react";
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
        await navigator.clipboard.writeText(sectionText);
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
      <div className={styles.cutCopyContainer} ref={containerRef}>
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
                  {section.split("").map((char, charIndex) => {
                    const globalIndex = sectionStart + charIndex;
                    return (
                      <span key={charIndex} data-char-index={globalIndex}>
                        {hoverPosition === globalIndex && (
                          <span className={styles.cutCursor} />
                        )}
                        {char}
                      </span>
                    );
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className={styles.hint}>
        Clic gauche : copier | Clic droit : couper ici
      </p>
      {toast && <div className={styles.toast}>{toast}</div>}
    </>
  );
}

// Helper: get the start position of a section
function getSectionStart(cutPositions: number[], sectionIndex: number): number {
  if (sectionIndex === 0) return 0;
  return cutPositions[sectionIndex - 1];
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
