"use server";

import { createClient } from "redis";

let client: ReturnType<typeof createClient>;

async function getClient() {
  if (!client) {
    client = await createClient({
      url: process.env.REDIS_URL,
      pingInterval: 10000,
    }).connect();
  }

  if (!client.isReady) {
    try {
      await client.connect();
    } catch (e) {
      if (e.message.includes("Socket already opened")) {
        return client;
      }

      throw e;
    }
  }

  return client;
}

import type { Format } from "../lib/formats";

export type Post = {
  id: string;
  img: string | null; // data-url
  imgX: number;
  title: string;
  intro: string;
  rubrique: string;
  slidesContent: string[];
  position: "top" | "bottom";
  subForMore: boolean;
  numero: number;
  format: Format;
};

type RedisPost = Partial<
  Omit<Post, "slidesContent" | "subForMore"> & {
    slidesContent: string;
    subForMore: "true" | "false";
    // serialized array
  }
>;

const toRedisHash = (post: Partial<Post> & Pick<Post, "id">): RedisPost => ({
  ...(post.img != undefined ? { img: post.img } : {}),
  ...(post.imgX != undefined ? { imgX: post.imgX } : {}),
  ...(post.title != undefined ? { title: post.title } : {}),
  ...(post.intro != undefined ? { intro: post.intro } : {}),
  ...(post.rubrique != undefined ? { rubrique: post.rubrique } : {}),
  ...(post.slidesContent != undefined
    ? { slidesContent: JSON.stringify(post.slidesContent) }
    : {}),
  ...(post.position != undefined ? { position: post.position } : {}),
  ...(post.subForMore !== undefined
    ? { subForMore: String(post.subForMore) as "true" | "false" }
    : {}),
  ...(post.numero != undefined ? { numero: post.numero } : {}),
  ...(post.format != undefined ? { format: post.format } : {}),
});

const toJsValue = (id: string, post: RedisPost): Post => ({
  ...newPost(id),
  ...post,
  slidesContent: post.slidesContent ? JSON.parse(post.slidesContent) : [],
  subForMore: post.subForMore === "true",
});

const newPost = (id: string): Post => ({
  id,
  img: null,
  imgX: 0,
  title: "",
  intro: "",
  rubrique: "",
  slidesContent: [],
  position: "top",
  subForMore: false,
  numero: 1,
  format: "post",
});

const memory: { [key: string]: Post } = {};

export async function getPost(id: string): Promise<Post> {
  if (!process.env.REDIS_URL) {
    return memory[id] || newPost(id);
  }

  const client = await getClient();
  const redisResult = (await client.hGetAll(`hash:${id}`)) as RedisPost;
  if (redisResult) {
    return toJsValue(id, redisResult) as Post;
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

  const client = await getClient();
  await client.hSet(`hash:${post.id}`, toRedisHash(post));
  await client.EXPIRE(`hash:${post.id}`, 60 * 60 * 24 * 30);
  return;
}
