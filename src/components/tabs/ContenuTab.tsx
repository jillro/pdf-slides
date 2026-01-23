"use client";

import styles from "./ContenuTab.module.css";

interface ContenuTabProps {
  // WordPress import
  wpUrl: string;
  setWpUrl: (url: string) => void;
  wpLoading: boolean;
  wpError: string | null;
  setWpError: (error: string | null) => void;
  importWithContent: boolean;
  setImportWithContent: (value: boolean) => void;
  onWordPressImport: () => void;

  // Content fields
  rubrique: string;
  setRubrique: (value: string) => void;
  unsavedRubrique: boolean;

  title: string;
  setTitle: (value: string) => void;
  unsavedTitle: boolean;

  intro: string;
  setIntro: (value: string) => void;
  unsavedIntro: boolean;
}

export default function ContenuTab({
  wpUrl,
  setWpUrl,
  wpLoading,
  wpError,
  setWpError,
  importWithContent,
  setImportWithContent,
  onWordPressImport,
  rubrique,
  setRubrique,
  unsavedRubrique,
  title,
  setTitle,
  unsavedTitle,
  intro,
  setIntro,
  unsavedIntro,
}: ContenuTabProps) {
  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label className={styles.sectionTitle}>Importer depuis WordPress</label>
        <div className={styles.importRow}>
          <input
            type="url"
            placeholder="URL de l'article"
            value={wpUrl}
            onChange={(e) => {
              setWpUrl(e.target.value);
              setWpError(null);
            }}
            className={styles.urlInput}
          />
          <button
            onClick={onWordPressImport}
            disabled={wpLoading}
            className={styles.importButton}
          >
            {wpLoading ? "..." : "Importer"}
          </button>
        </div>
        {wpError && <div className={styles.importError}>{wpError}</div>}
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={importWithContent}
            onChange={(e) => setImportWithContent(e.target.checked)}
          />
          Importer le contenu de l&apos;article
        </label>
      </div>

      <div className={styles.section}>
        <label htmlFor="rubrique" className={styles.sectionTitle}>
          Rubrique {unsavedRubrique && <span className={styles.unsaved}>⏳</span>}
        </label>
        <select
          id="rubrique"
          value={rubrique}
          onChange={(e) => setRubrique(e.target.value)}
          className={styles.select}
        >
          <option value="édito">Édito</option>
          <option value="actu">Actu</option>
          <option value="ailleurs">Ailleurs</option>
          <option value="pop !">Pop !</option>
          <option value="comprendre">Comprendre</option>
          <option value="dossier">Dossier</option>
          <option value="au cas où">Au cas où</option>
        </select>
      </div>

      <div className={styles.section}>
        <label htmlFor="title" className={styles.sectionTitle}>
          Titre {unsavedTitle && <span className={styles.unsaved}>⏳</span>}
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.textInput}
        />
      </div>

      <div className={styles.section}>
        <label htmlFor="intro" className={styles.sectionTitle}>
          Intro {unsavedIntro && <span className={styles.unsaved}>⏳</span>}
        </label>
        <textarea
          id="intro"
          rows={4}
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          className={styles.textarea}
        />
      </div>
    </div>
  );
}
