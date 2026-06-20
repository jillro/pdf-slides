"use server";

// Zernio is a unified social publishing REST API (https://zernio.com).
// We use it to push rendered slides as *drafts* to Instagram, Facebook and
// Bluesky.
//
// Field casing verified against the OpenAPI spec at
// https://docs.zernio.com/api/openapi:
//   POST /v1/media/presign  { filename, contentType } -> { uploadUrl, publicUrl }
//   POST /v1/posts          { content, platforms: [{ platform, accountId }],
//                             isDraft,
//                             mediaItems: [{ type: "image", url, altText }] }

const ZERNIO_API_BASE = "https://zernio.com/api/v1";

export type ZernioPlatform = "instagram" | "facebook" | "bluesky";

const ACCOUNT_ID_VARS: Record<ZernioPlatform, string> = {
  instagram: "ZERNIO_INSTAGRAM_ACCOUNT_ID",
  facebook: "ZERNIO_FACEBOOK_ACCOUNT_ID",
  bluesky: "ZERNIO_BLUESKY_ACCOUNT_ID",
};

function readConfig() {
  const apiKey = process.env.ZERNIO_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    accountIds: {
      instagram: process.env.ZERNIO_INSTAGRAM_ACCOUNT_ID || null,
      facebook: process.env.ZERNIO_FACEBOOK_ACCOUNT_ID || null,
      bluesky: process.env.ZERNIO_BLUESKY_ACCOUNT_ID || null,
    } as Record<ZernioPlatform, string | null>,
  };
}

export type ZernioDraftResult =
  | { success: true }
  | { success: false; error: string };

// Which platforms are fully configured (API key + that platform's account ID).
// Drives which buttons the UI offers.
export async function getZernioPlatforms(): Promise<
  Record<ZernioPlatform, boolean>
> {
  const cfg = readConfig();
  if (!cfg) {
    return { instagram: false, facebook: false, bluesky: false };
  }
  return {
    instagram: cfg.accountIds.instagram !== null,
    facebook: cfg.accountIds.facebook !== null,
    bluesky: cfg.accountIds.bluesky !== null,
  };
}

// Step 1 of the media flow: ask Zernio for a presigned upload URL. The client
// then PUTs the blob to uploadUrl and references publicUrl in the draft.
export async function createZernioPresign({
  filename,
  contentType,
}: {
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  const cfg = readConfig();
  if (!cfg) return null;

  let response: Response;
  try {
    response = await fetch(`${ZERNIO_API_BASE}/media/presign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename, contentType }),
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;
  const data = await response.json();
  if (!data.uploadUrl || !data.publicUrl) return null;
  return { uploadUrl: data.uploadUrl, publicUrl: data.publicUrl };
}

// Step 2: create one draft post targeting one or several platforms, referencing
// already-uploaded media public URLs. Each platform keeps its own caption via
// customContent, so a single post can fan out to several accounts (e.g.
// Instagram + Facebook) while preserving per-platform copy.
export async function createZernioDraft({
  platforms,
  media,
}: {
  platforms: { platform: ZernioPlatform; content: string }[];
  media: { url: string; altText?: string }[];
}): Promise<ZernioDraftResult> {
  const cfg = readConfig();
  if (!cfg) return { success: false, error: "Zernio non configuré" };

  const resolved: { platform: ZernioPlatform; accountId: string }[] = [];
  for (const { platform } of platforms) {
    const accountId = cfg.accountIds[platform];
    if (!accountId) {
      return {
        success: false,
        error: `${ACCOUNT_ID_VARS[platform]} manquant`,
      };
    }
    resolved.push({ platform, accountId });
  }

  let response: Response;
  try {
    response = await fetch(`${ZERNIO_API_BASE}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: platforms[0].content,
        mediaItems: media.map(({ url, altText }) => ({
          type: "image",
          url,
          altText,
        })),
        platforms: platforms.map(({ platform, content }, i) => ({
          platform,
          accountId: resolved[i].accountId,
          customContent: content,
        })),
        isDraft: true,
      }),
    });
  } catch {
    return { success: false, error: "Impossible de contacter Zernio" };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error =
      (body && (body.error || body.message)) ||
      `Erreur Zernio (${response.status})`;
    return { success: false, error };
  }

  return { success: true };
}
