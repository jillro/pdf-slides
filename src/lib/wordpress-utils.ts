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

export function decodeHtmlEntities(text: string): string {
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

export function stripHtmlTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, "")).trim();
}

export function htmlToPlainText(html: string): string {
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

export const RUBRIQUE_MAPPING: Record<string, string> = {
  actu: "actu",
  edito: "édito",
  ailleurs: "ailleurs",
  pop: "pop !",
  comprendre: "comprendre",
  dossier: "dossier",
  "au-cas-ou": "au cas où",
};

export function parseWordPressUrl(
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

export async function tryFetchOriginalImage(
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
