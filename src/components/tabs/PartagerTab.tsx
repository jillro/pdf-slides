"use client";

import styles from "./PartagerTab.module.css";
import LegendGenerator from "../LegendGenerator";

interface PartagerTabProps {
  subForMore: boolean;
  setSubForMore: (value: boolean) => void;
  unsavedSubForMore: boolean;

  numero: number;
  setNumero: (value: number) => void;
  unsavedNumero: boolean;

  legendContent: string;
  setLegendContent: (value: string) => void;
  unsavedLegendContent: boolean;

  imageCaption: string | null;
  setImageCaption: (value: string | null) => void;
  unsavedImageCaption: boolean;

  articleUrl: string | null;

  onDownload: () => void;
}

export default function PartagerTab({
  subForMore,
  setSubForMore,
  unsavedSubForMore,
  numero,
  setNumero,
  unsavedNumero,
  legendContent,
  setLegendContent,
  unsavedLegendContent,
  imageCaption,
  setImageCaption,
  unsavedImageCaption,
  articleUrl,
  onDownload,
}: PartagerTabProps) {
  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={subForMore}
            onChange={(e) => setSubForMore(e.target.checked)}
          />
          Ajouter la slide « Abonne-toi pour lire la suite »
          {unsavedSubForMore && <span className={styles.unsaved}>⏳</span>}
        </label>
      </div>

      {subForMore && (
        <div className={styles.section}>
          <label htmlFor="numero" className={styles.sectionTitle}>
            Numéro {unsavedNumero && <span className={styles.unsaved}>⏳</span>}
          </label>
          <input
            type="text"
            id="numero"
            value={numero}
            maxLength={2}
            onChange={(e) => {
              const val = e.target.value;
              if (!isNaN(Number(val)) && (Number(val) || val === "")) {
                setNumero(Number(val));
              }
            }}
            className={styles.numberInput}
          />
        </div>
      )}

      <div className={styles.section}>
        <label htmlFor="legendContent" className={styles.sectionTitle}>
          Légende{" "}
          {unsavedLegendContent && <span className={styles.unsaved}>⏳</span>}
        </label>
        <textarea
          id="legendContent"
          rows={4}
          value={legendContent}
          onChange={(e) => setLegendContent(e.target.value)}
          className={styles.textarea}
        />
      </div>

      <div className={styles.section}>
        <label htmlFor="imageCaption" className={styles.sectionTitle}>
          Crédit image{" "}
          {unsavedImageCaption && <span className={styles.unsaved}>⏳</span>}
        </label>
        <input
          type="text"
          id="imageCaption"
          value={imageCaption || ""}
          onChange={(e) => setImageCaption(e.target.value || null)}
          className={styles.textInput}
        />
      </div>

      <LegendGenerator
        legendContent={legendContent}
        imageCaption={imageCaption}
        articleUrl={articleUrl}
      />

      <button onClick={onDownload} className={styles.downloadButton}>
        Télécharger les slides
      </button>
    </div>
  );
}
