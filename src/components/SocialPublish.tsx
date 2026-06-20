"use client";

import { useEffect, useState } from "react";
import styles from "./SocialPublish.module.css";
import { usePostEditor, type PublishTarget } from "./PostEditorContext";
import { getZernioPlatforms } from "../app/zernio";

const TARGET_LABELS: Record<PublishTarget, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  bluesky: "Bluesky",
};

const TARGET_ORDER: PublishTarget[] = ["instagram", "facebook", "bluesky"];

export default function SocialPublish() {
  const { publishDrafts, publishStatus } = usePostEditor();

  // null while the configured-platforms probe is in flight.
  const [available, setAvailable] = useState<PublishTarget[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const zernio = await getZernioPlatforms();
      const targets = TARGET_ORDER.filter((t) => zernio[t]);
      setAvailable(targets);
      setSelected(Object.fromEntries(targets.map((t) => [t, true])));
    })();
  }, []);

  // Render nothing while probing or when no platform is configured.
  if (available === null || available.length === 0) return null;

  const { running, results } = publishStatus;
  const selectedTargets = available.filter((t) => selected[t]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Pousser en brouillons</h3>
      <fieldset className={styles.targets} disabled={running}>
        <legend className={styles.legend}>Réseaux</legend>
        {available.map((target) => (
          <label key={target} className={styles.targetLabel}>
            <input
              type="checkbox"
              checked={selected[target] ?? false}
              onChange={(e) =>
                setSelected((s) => ({ ...s, [target]: e.target.checked }))
              }
            />
            {TARGET_LABELS[target]}
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className={styles.publishButton}
        onClick={() => publishDrafts(selectedTargets)}
        disabled={running || selectedTargets.length === 0}
        aria-busy={running}
      >
        {running ? "Envoi en cours..." : "Pousser en brouillons"}
      </button>
      <div className={styles.results} aria-live="polite">
        {available.map((target) => {
          const result = results[target];
          if (!result) return null;
          return (
            <div
              key={target}
              className={
                result.success ? styles.resultSuccess : styles.resultError
              }
            >
              <strong>{TARGET_LABELS[target]}</strong>{" "}
              {result.success ? "Brouillon créé" : result.error}
              {result.note ? ` (${result.note})` : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
