"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deletePostAction, type Post } from "../app/storage";
import styles from "./PostCard.module.css";

type PostCardProps = {
  post: Pick<Post, "id" | "title" | "img" | "updatedAt">;
};

function formatRelativeDate(timestamp: number): string {
  if (!timestamp) return "—";

  const diffMs = Date.now() - timestamp;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  if (diffSec < 60) return "à l'instant";
  if (diffMin < 60)
    return `il y a ${diffMin} minute${diffMin > 1 ? "s" : ""}`;
  if (diffHour < 24)
    return `il y a ${diffHour} heure${diffHour > 1 ? "s" : ""}`;
  if (diffDay < 30) return `il y a ${diffDay} jour${diffDay > 1 ? "s" : ""}`;
  if (diffMonth < 12)
    return `il y a ${diffMonth} mois`;
  return `il y a ${diffYear} an${diffYear > 1 ? "s" : ""}`;
}

export default function PostCard({ post }: PostCardProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (confirming) return;
    setConfirming(true);
    const ok = window.confirm("Supprimer ce post ?");
    setConfirming(false);
    if (!ok) return;

    startTransition(async () => {
      await deletePostAction(post.id);
    });
  };

  const title = post.title?.trim();

  return (
    <article className={styles.card}>
      <Link href={`/${post.id}`} className={styles.cardLink}>
        {post.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.img}
            alt=""
            aria-hidden="true"
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.thumbnailPlaceholder} aria-hidden="true" />
        )}
        <div className={styles.info}>
          <h2 className={styles.title}>
            {title || <span className={styles.untitled}>Sans titre</span>}
          </h2>
          <p className={styles.date}>{formatRelativeDate(post.updatedAt)}</p>
        </div>
      </Link>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={handleDelete}
        disabled={isPending || confirming}
        aria-label={`Supprimer le post ${title || "sans titre"}`}
        title="Supprimer"
      >
        ×
      </button>
    </article>
  );
}
