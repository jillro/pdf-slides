"use server";

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

const HTML_ENTITIES: Record<string, string> = {
  nbsp: "\u00A0",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  // French accented characters
  agrave: "à",
  acirc: "â",
  auml: "ä",
  eacute: "é",
  egrave: "è",
  ecirc: "ê",
  euml: "ë",
  iacute: "í",
  igrave: "ì",
  icirc: "î",
  iuml: "ï",
  oacute: "ó",
  ograve: "ò",
  ocirc: "ô",
  ouml: "ö",
  uacute: "ú",
  ugrave: "ù",
  ucirc: "û",
  uuml: "ü",
  ccedil: "ç",
  oelig: "œ",
  aelig: "æ",
  // Punctuation
  ndash: "\u2013",
  mdash: "\u2014",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
  hellip: "\u2026",
  laquo: "\u00AB",
  raquo: "\u00BB",
};

function decodeHtmlEntities(text: string): string {
  return (
    text
      // Decode numeric entities (decimal): &#123;
      .replace(/&#(\d+);/g, (_, code) =>
        String.fromCharCode(parseInt(code, 10)),
      )
      // Decode numeric entities (hex): &#x7B;
      .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
        String.fromCharCode(parseInt(code, 16)),
      )
      // Decode named entities: &amp;
      .replace(/&([a-zA-Z]+);/g, (match, name) => HTML_ENTITIES[name] || match)
  );
}

function stripHtmlTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, "")).trim();
}

function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(p|div)[^>]*>/gi, "\n")
      .replace(/<[^>]*>/g, ""),
  )
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

  // 3. Extract title, content, excerpt, and link
  const title = stripHtmlTags(postData.title?.rendered || "");
  const content = htmlToPlainText(postData.content?.rendered || "");
  const legendContent = stripHtmlTags(postData.excerpt?.rendered || "");
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
          imageCaption = stripHtmlTags(media.caption.rendered) || null;
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
