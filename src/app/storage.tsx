"use server";

import { createClient } from "redis";

let client: ReturnType<typeof createClient>;

async function getClient() {
  if (!client) {
    client = await createClient({
      url: process.env.REDIS_URL,
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

export type Post = {
  id: string;
  img: string | null; // data-url
  title: string;
  intro: string;
  rubrique: string;
  slidesContent: string[];
  position: "top" | "bottom";
};

type RedisPost = Partial<
  Omit<Post, "slidesContent"> & {
    slidesContent: string; // serialized array
  }
>;

const toRedisHash = (post: Partial<Post> & Pick<Post, "id">): RedisPost => ({
  ...(post.img ? { img: post.img } : {}),
  ...(post.title ? { title: post.title } : {}),
  ...(post.intro ? { intro: post.intro } : {}),
  ...(post.rubrique ? { rubrique: post.rubrique } : {}),
  ...(post.slidesContent
    ? { slidesContent: JSON.stringify(post.slidesContent) }
    : {}),
  ...(post.position ? { position: post.position } : {}),
});

const toJsValue = (id: string, post: RedisPost): Post => ({
  ...newPost(id),
  ...post,
  slidesContent: post.slidesContent ? JSON.parse(post.slidesContent) : [],
});

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
