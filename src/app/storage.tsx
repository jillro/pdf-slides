"use server";

import { createClient } from "redis";

let client: ReturnType<typeof createClient>;
if (process.env.REDIS_URL) {
  client = await createClient({
    url: process.env.REDIS_URL,
  }).connect();
}

export type Post = {
  id: string;
  img: string | null; // data-url
  title: string;
  intro: string;
  rubrique: string;
  slidesContent: string[];
  position: "top" | "bottom";
};

const memory: { [key: string]: Post } = {};

export async function getPost(id: string) {
  const data = process.env.REDIS_URL
    ? JSON.parse((await client.GET(id)) as string)
    : memory[id];
  return (
    data || {
      id,
      img: null,
      title: "",
      intro: "",
      rubrique: "",
      slidesContent: [],
      position: "top",
    }
  );
}

export async function savePost(post: Post) {
  "use server";

  if (!process.env.REDIS_URL) {
    memory[post.id] = post;
    return;
  }

  await client.SET(post.id, JSON.stringify(post));
}
