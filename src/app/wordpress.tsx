"use server";

import { applyFrenchTypography } from "../lib/french-typography";
import {
  stripHtmlTags,
  htmlToPlainText,
  RUBRIQUE_MAPPING,
  parseWordPressUrl,
  tryFetchOriginalImage,
} from "../lib/wordpress-utils";

export type WordPressImportResult =
  | {
      success: true;
      data: {
        title: string;
        content: string;
        imageDataUrl: string | null;
        rubrique: string | null;
        legendContent: string;
        articleUrl: string;
        imageCaption: string | null;
      };
    }
  | { success: false; error: string };

export async function importFromWordPress(
  url: string,
): Promise<WordPressImportResult> {
  "use server";

  // 1. Parse URL to get domain and slug
  const parsed = parseWordPressUrl(url);
  if (!parsed) {
    return { success: false, error: "URL invalide" };
  }

  const { domain, slug } = parsed;

  // 2. Fetch post data from WordPress API
  let postData;
  try {
    const response = await fetch(
      `${domain}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}`,
    );
    if (!response.ok) {
      return {
        success: false,
        error: "API WordPress non disponible sur ce site",
      };
    }
    const posts = await response.json();
    if (!posts || posts.length === 0) {
      return { success: false, error: "Article non trouvé" };
    }
    postData = posts[0];
  } catch {
    return {
      success: false,
      error: "Impossible de contacter le site WordPress",
    };
  }

  // 3. Extract title, content, excerpt, and link
  const title = applyFrenchTypography(
    stripHtmlTags(postData.title?.rendered || ""),
  );
  const content = applyFrenchTypography(
    htmlToPlainText(postData.content?.rendered || ""),
  );
  const legendContent = applyFrenchTypography(
    stripHtmlTags(postData.excerpt?.rendered || ""),
  );
  const articleUrl = postData.link || "";

  // 4. Fetch category and map to rubrique
  let rubrique: string | null = null;
  if (postData.categories && postData.categories.length > 0) {
    try {
      const categoryId = postData.categories[0];
      const categoryResponse = await fetch(
        `${domain}/wp-json/wp/v2/categories/${categoryId}`,
      );
      if (categoryResponse.ok) {
        const category = await categoryResponse.json();
        const categorySlug = category.slug?.toLowerCase();
        rubrique = RUBRIQUE_MAPPING[categorySlug] || null;
      }
    } catch {
      // Silent fail for category - not critical
    }
  }

  // 5. Fetch featured image and caption
  let imageDataUrl: string | null = null;
  let imageCaption: string | null = null;
  if (postData.featured_media) {
    try {
      const mediaResponse = await fetch(
        `${domain}/wp-json/wp/v2/media/${postData.featured_media}`,
      );
      if (mediaResponse.ok) {
        const media = await mediaResponse.json();
        // Extract image caption
        if (media.caption?.rendered) {
          const rawCaption = stripHtmlTags(media.caption.rendered);
          imageCaption = rawCaption ? applyFrenchTypography(rawCaption) : null;
        }
        const sourceUrl = media.source_url;
        if (sourceUrl) {
          const imageUrl = await tryFetchOriginalImage(sourceUrl);
          if (imageUrl) {
            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer();
              const base64 = Buffer.from(imageBuffer).toString("base64");
              const contentType =
                imageResponse.headers.get("content-type") || "image/jpeg";
              imageDataUrl = `data:${contentType};base64,${base64}`;
            }
          }
        }
      }
    } catch {
      // Silent fail for image - not critical
    }
  }

  return {
    success: true,
    data: {
      title,
      content,
      imageDataUrl,
      rubrique,
      legendContent,
      articleUrl,
      imageCaption,
    },
  };
}
