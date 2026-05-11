"use server";

import { randomUUID } from "crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REQUIRED_VARS = [
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

function readConfig() {
  for (const name of REQUIRED_VARS) {
    if (!process.env[name]) return null;
  }
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/+$/, "");
  const bucket = process.env.S3_BUCKET!;
  return {
    endpoint,
    region: process.env.S3_REGION!,
    bucket,
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    publicUrlBase: (
      process.env.S3_PUBLIC_URL_BASE || `${endpoint}/${bucket}`
    ).replace(/\/+$/, ""),
  };
}

let cachedClient: S3Client | null = null;
function getClient(cfg: NonNullable<ReturnType<typeof readConfig>>) {
  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: cfg.endpoint,
      region: cfg.region,
      forcePathStyle: false,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }
  return cachedClient;
}

export async function isS3Configured(): Promise<boolean> {
  return readConfig() !== null;
}

export async function getPublicUrlBase(): Promise<string | null> {
  const cfg = readConfig();
  return cfg ? cfg.publicUrlBase : null;
}

export async function createUploadUrl({
  postId,
  contentType,
  ext,
}: {
  postId: string;
  contentType: string;
  ext: string;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string } | null> {
  const cfg = readConfig();
  if (!cfg) return null;

  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  const key = `posts/${postId}/${randomUUID()}.${safeExt}`;
  const client = getClient(cfg);
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 5 },
  );

  return {
    uploadUrl,
    publicUrl: `${cfg.publicUrlBase}/${key}`,
    key,
  };
}

export async function deleteS3Object(publicUrl: string): Promise<void> {
  const cfg = readConfig();
  if (!cfg) return;
  if (!publicUrl.startsWith(`${cfg.publicUrlBase}/`)) return;

  const key = publicUrl.slice(cfg.publicUrlBase.length + 1);
  if (!key) return;

  const client = getClient(cfg);
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }),
    );
  } catch (e: unknown) {
    const name = (e as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") return;
    throw e;
  }
}
