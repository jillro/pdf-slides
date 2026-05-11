"use server";

import { createClient } from "redis";
import { deleteS3Object, getPublicUrlBase } from "./s3";

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
import type { ContentBgThemeId } from "../lib/contentBgThemes";

export type FirstSlideLayout = "gradient" | "split-light" | "split-dark";

export type Post = {
  id: string;
  img: string | null; // data-url
  imgX: number;
  title: string;
  intro: string;
  rubrique: string;
  slidesContent: string[];
  slideThemes: ContentBgThemeId[];
  position: "top" | "bottom";
  subForMore: boolean;
  numero: number;
  format: Format;
  legendContent: string;
  imageCaption: string | null;
  articleUrl: string | null;
  firstSlideLayout: FirstSlideLayout;
};

type RedisPost = Partial<
  Omit<
    Post,
    | "slidesContent"
    | "slideThemes"
    | "subForMore"
    | "imageCaption"
    | "articleUrl"
  > & {
    slidesContent: string; // serialized array
    slideThemes: string; // serialized array
    subForMore: "true" | "false";
    imageCaption: string;
    articleUrl: string;
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
  ...(post.slideThemes != undefined
    ? { slideThemes: JSON.stringify(post.slideThemes) }
    : {}),
  ...(post.position != undefined ? { position: post.position } : {}),
  ...(post.subForMore !== undefined
    ? { subForMore: String(post.subForMore) as "true" | "false" }
    : {}),
  ...(post.numero != undefined ? { numero: post.numero } : {}),
  ...(post.format != undefined ? { format: post.format } : {}),
  ...(post.legendContent != undefined
    ? { legendContent: post.legendContent }
    : {}),
  ...(post.imageCaption != undefined
    ? { imageCaption: post.imageCaption ?? "" }
    : {}),
  ...(post.articleUrl != undefined
    ? { articleUrl: post.articleUrl ?? "" }
    : {}),
  ...(post.firstSlideLayout != undefined
    ? { firstSlideLayout: post.firstSlideLayout }
    : {}),
});

const toJsValue = (id: string, post: RedisPost): Post => ({
  ...newPost(id),
  ...post,
  slidesContent: post.slidesContent ? JSON.parse(post.slidesContent) : [],
  slideThemes: post.slideThemes ? JSON.parse(post.slideThemes) : [],
  subForMore: post.subForMore === "true",
  imageCaption: post.imageCaption || null,
  articleUrl: post.articleUrl || null,
});

const newPost = (id: string): Post => ({
  id,
  img: null,
  imgX: 0,
  title: "",
  intro: "",
  rubrique: "",
  slidesContent: [],
  slideThemes: [],
  position: "top",
  subForMore: false,
  numero: 1,
  format: "post",
  legendContent: "",
  imageCaption: null,
  articleUrl: null,
  firstSlideLayout: "gradient",
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

async function maybeDeletePreviousImage(
  previousImg: string | undefined | null,
  post: Partial<Post>,
) {
  if (!("img" in post)) return;
  if (!previousImg) return;
  if (previousImg === post.img) return;

  const publicUrlBase = await getPublicUrlBase();
  if (!publicUrlBase) return;
  if (!previousImg.startsWith(`${publicUrlBase}/`)) return;

  await deleteS3Object(previousImg);
}

export async function savePost(post: Partial<Post> & Pick<Post, "id">) {
  "use server";

  if (!process.env.REDIS_URL) {
    const previousImg = memory[post.id]?.img;
    await maybeDeletePreviousImage(previousImg, post);

    if (!memory[post.id]) {
      memory[post.id] = newPost(post.id);
    }
    Object.assign(memory[post.id], post);

    return;
  }

  const client = await getClient();
  const previousImg = (await client.hGet(`hash:${post.id}`, "img")) as
    | string
    | undefined;
  await maybeDeletePreviousImage(previousImg, post);

  await client.hSet(`hash:${post.id}`, toRedisHash(post));
  return;
}
