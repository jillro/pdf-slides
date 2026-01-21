"use server";

export type WordPressImportResult =
  | {
      success: true;
      data: {
        title: string;
        content: string;
        imageDataUrl: string | null;
        rubrique: string | null;
      };
    }
  | { success: false; error: string };

function parseWordPressUrl(
  url: string,
): { domain: string; slug: string } | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const slug = pathParts[pathParts.length - 1];
    if (!slug) return null;
    return { domain: parsed.origin, slug };
  } catch {
    return null;
  }
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .trim();
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const RUBRIQUE_MAPPING: Record<string, string> = {
  actu: "actu",
  edito: "édito",
  ailleurs: "ailleurs",
  pop: "pop !",
  comprendre: "comprendre",
  dossier: "dossier",
  "au-cas-ou": "au cas où",
};

async function tryFetchOriginalImage(
  sourceUrl: string,
): Promise<string | null> {
  // Try to get the original unprocessed image by stripping WordPress suffixes
  const urlWithoutSuffix = sourceUrl
    .replace(/-scaled(\.[^.]+)$/, "$1")
    .replace(/-e\d+(\.[^.]+)$/, "$1");

  // Try original first if different from source
  if (urlWithoutSuffix !== sourceUrl) {
    try {
      const response = await fetch(urlWithoutSuffix, { method: "HEAD" });
      if (response.ok) {
        return urlWithoutSuffix;
      }
    } catch {
      // Fall through to source URL
    }
  }

  return sourceUrl;
}

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

  // 3. Extract title and content
  const title = stripHtmlTags(postData.title?.rendered || "");
  const content = htmlToPlainText(postData.content?.rendered || "");

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

  // 5. Fetch featured image
  let imageDataUrl: string | null = null;
  if (postData.featured_media) {
    try {
      const mediaResponse = await fetch(
        `${domain}/wp-json/wp/v2/media/${postData.featured_media}`,
      );
      if (mediaResponse.ok) {
        const media = await mediaResponse.json();
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
    },
  };
}
