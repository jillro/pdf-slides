import Link from "next/link";
import PostCard from "../components/PostCard";
import { listPosts } from "./storage";
import styles from "../components/HomePage.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const posts = await listPosts();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Visuels PDF</h1>
        <Link href="/new" className={styles.newPostButton}>
          + Nouveau post
        </Link>
      </header>

      {posts.length === 0 ? (
        <p className={styles.empty}>
          Aucun post pour l&apos;instant. Cliquez sur « Nouveau post » pour
          commencer.
        </p>
      ) : (
        <section className={styles.grid}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                title: post.title,
                img: post.img,
                updatedAt: post.updatedAt,
              }}
            />
          ))}
        </section>
      )}
    </main>
  );
}
