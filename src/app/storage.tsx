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

export async function getPost(id: string): Promise<Post> {
  if (!process.env.REDIS_URL) {
    return memory[id] || newPost(id);
  }

  if (!client.isReady) {
    await client.connect();
  }

  const redisResult = await client.json.get(`json:${id}`);
  if (redisResult) {
    return redisResult as Post;
  }

  const legacyRedisResult: string = (await client.GET(id)) as string;
  if (legacyRedisResult) {
    return JSON.parse(legacyRedisResult) as Post;
  }

  return newPost(id);
}

export async function savePost(post: Partial<Post> & Pick<Post, "id">) {
  "use server";

  if (!process.env.REDIS_URL) {
    if (!memory[post.id]) {
      memory[post.id] = newPost(post.id);
    }
    Object.assign(memory[post.id], post);

    return;
  }

  if (!client.isReady) {
    await client.connect();
  }

  client.json.merge(`json:${post.id}`, "$", post);
  client.EXPIRE(`json:${post.id}`, 60 * 60 * 24 * 30);
  return;
}
