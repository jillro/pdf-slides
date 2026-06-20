import { applyFrenchTypography } from "./french-typography";

// Shared caption logic used by both the copy-paste UI (LegendGenerator) and the
// "push to drafts" flow (SocialPublish). Single source of truth so a network's
// caption is identical whether copied by hand or sent through an API.
export type CaptionType = "instagram" | "facebook" | "whatsapp" | "bluesky";

export function generateCaption(
  type: CaptionType,
  legendContent: string,
  imageCaption: string | null,
  articleUrl: string | null,
): string {
  const content = applyFrenchTypography(legendContent.trim());
  const caption = imageCaption ? applyFrenchTypography(imageCaption) : null;

  switch (type) {
    case "instagram": {
      if (caption) {
        return `${content}\n\n${caption}`;
      }
      return content;
    }
    case "whatsapp": {
      const parts = ["📰 Nouvel article !", "", `_${content}_`];
      if (articleUrl) {
        parts.push("", `💡 À lire sur notre site : ${articleUrl}`);
      }
      return parts.join("\n");
    }
    // Facebook reuses the Bluesky-style caption (legend + article link).
    case "facebook":
    case "bluesky": {
      const parts = [content];
      if (articleUrl) {
        parts.push("", `💡 À lire sur notre site : ${articleUrl}`);
      }
      return parts.join("\n");
    }
  }
}
