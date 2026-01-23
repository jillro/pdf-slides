"use client";

import { useState } from "react";
import styles from "./LegendGenerator.module.css";

type Props = {
  legendContent: string;
  imageCaption: string | null;
  articleUrl: string | null;
};

type CaptionType = "instagram" | "whatsapp" | "bluesky";

function generateCaption(
  type: CaptionType,
  legendContent: string,
  imageCaption: string | null,
  articleUrl: string | null,
): string {
  const content = legendContent.trim();

  switch (type) {
    case "instagram": {
      if (imageCaption) {
        return `${content}\n\n${imageCaption}`;
      }
      return content;
    }
    case "whatsapp": {
      const parts = ["📰 Nouvel article !", "", `_${content}_`];
      if (articleUrl) {
        parts.push("", `💡 À lire sur notre site : ${articleUrl}`);
      }
      return parts.join("\n");
    }
    case "bluesky": {
      const parts = [content];
      if (articleUrl) {
        parts.push("", `💡 À lire sur notre site : ${articleUrl}`);
      }
      return parts.join("\n");
    }
  }
}

export default function LegendGenerator({
  legendContent,
  imageCaption,
  articleUrl,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState<CaptionType | null>(null);

  const handleCopy = async (type: CaptionType) => {
    const caption = generateCaption(
      type,
      legendContent,
      imageCaption,
      articleUrl,
    );
    await navigator.clipboard.writeText(caption);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const networks: { type: CaptionType; name: string }[] = [
    { type: "instagram", name: "Instagram" },
    { type: "whatsapp", name: "WhatsApp" },
    { type: "bluesky", name: "Bluesky / Mastodon" },
  ];

  const hasContent = legendContent.trim().length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <span className={`${styles.toggle} ${isOpen ? styles.open : ""}`}>
          &#9654;
        </span>
        <label>Légendes</label>
      </div>
      {isOpen && (
        <div className={styles.captions}>
          {!hasContent && (
            <div className={styles.empty}>
              Remplissez le champ &quot;Legende&quot; pour generer les legendes.
            </div>
          )}
          {hasContent &&
            networks.map(({ type, name }) => {
              const caption = generateCaption(
                type,
                legendContent,
                imageCaption,
                articleUrl,
              );
              return (
                <div key={type} className={styles.captionBlock}>
                  <div className={styles.captionHeader}>
                    <span className={styles.networkName}>{name}</span>
                    <button
                      className={`${styles.copyButton} ${copiedType === type ? styles.copied : ""}`}
                      onClick={() => handleCopy(type)}
                    >
                      {copiedType === type ? "Copie !" : "Copier"}
                    </button>
                  </div>
                  <div className={styles.captionPreview}>{caption}</div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
