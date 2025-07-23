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

const newPost = (id: string): Post => ({
  id,
  img: null,
  title: "",
  intro: "",
  rubrique: "",
  slidesContent: [],
  position: "top",
});

const memory: { [key: string]: Post } = {};

export async function getPost(id: string) {
  if (!process.env.REDIS_URL) {
    return memory[id] || newPost(id);
  }

  if (!client.isReady) {
    await client.connect();
  }

  const data: string = (await client.GET(id)) as string;
  return JSON.parse(data) || newPost(id);
}

export async function savePost(post: Post) {
  "use server";

  if (!process.env.REDIS_URL) {
    memory[post.id] = post;
    return;
  }

  if (!client.isReady) {
    await client.connect();
  }

  client.SET(post.id, JSON.stringify(post));
  client.EXPIRE(post.id, 60 * 60 * 24 * 30);
  return;
}
