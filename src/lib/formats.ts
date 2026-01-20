export type Format = "post" | "story";

export const FORMAT_DIMENSIONS = {
  post: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
} as const;

export const MAX_FORMAT_HEIGHT = Math.max(
  ...Object.values(FORMAT_DIMENSIONS).map((d) => d.height),
);
