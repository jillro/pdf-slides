import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import {
  stripHtmlTags,
  htmlToPlainText,
  RUBRIQUE_MAPPING,
  tryFetchOriginalImage,
} from "../src/lib/wordpress-utils";
import { applyFrenchTypography } from "../src/lib/french-typography";
import { MAX_FORMAT_HEIGHT } from "../src/lib/formats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = "https://partidesfemmes.fr";
const FIXTURES_DIR = path.join(__dirname, "../e2e/fixtures/posts");
const MAX_ARTICLES = 3;
const CHARS_PER_SLIDE = 800;

interface PostFixture {
  title: string;
  intro: string;
  rubrique: string;
  slidesContent: string[];
  position: "top" | "bottom";
  subForMore: boolean;
  numero: number;
  format: "post";
  legendContent: string;
  imageCaption: string | null;
  articleUrl: string;
  imageFile: string;
}

function splitContentIntoSlides(content: string): string[] {
  const paragraphs = content.split(/\n\n+/);
  const slides: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > CHARS_PER_SLIDE) {
      slides.push(current.trim());
      current = paragraph;
    } else {
      current = current ? current + "\n\n" + paragraph : paragraph;
    }
  }
  if (current.trim()) {
    slides.push(current.trim());
  }

  return slides;
}

async function fetchArticles() {
  const response = await fetch(
    `${SITE_URL}/wp-json/wp/v2/posts?per_page=${MAX_ARTICLES + 5}&_fields=id,slug,title,content,excerpt,link,categories,featured_media`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`);
  }
  return response.json();
}

async function fetchCategory(
  categoryId: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${SITE_URL}/wp-json/wp/v2/categories/${categoryId}`,
    );
    if (!response.ok) return null;
    const category = await response.json();
    const slug = category.slug?.toLowerCase();
    return RUBRIQUE_MAPPING[slug] || null;
  } catch {
    return null;
  }
}

async function fetchMediaAndSaveImage(
  mediaId: number,
  slug: string,
): Promise<{ imageFile: string; imageCaption: string | null } | null> {
  try {
    const response = await fetch(
      `${SITE_URL}/wp-json/wp/v2/media/${mediaId}`,
    );
    if (!response.ok) return null;
    const media = await response.json();

    let imageCaption: string | null = null;
    if (media.caption?.rendered) {
      const raw = stripHtmlTags(media.caption.rendered);
      imageCaption = raw ? applyFrenchTypography(raw) : null;
    }

    const sourceUrl = media.source_url;
    if (!sourceUrl) return null;

    const imageUrl = await tryFetchOriginalImage(sourceUrl);
    if (!imageUrl) return null;

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return null;

    const rawBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const resized = await sharp(rawBuffer)
      .resize({ height: MAX_FORMAT_HEIGHT, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const imageFile = `${slug}.jpg`;
    fs.writeFileSync(path.join(FIXTURES_DIR, imageFile), resized);

    return { imageFile, imageCaption };
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });

  console.log(`Fetching articles from ${SITE_URL}...`);
  const articles = await fetchArticles();

  let generated = 0;
  for (const article of articles) {
    if (generated >= MAX_ARTICLES) break;

    // Skip articles without featured images
    if (!article.featured_media) {
      console.log(`  Skipping "${article.slug}" (no featured image)`);
      continue;
    }

    const slug = article.slug;
    console.log(`Processing "${slug}"...`);

    // Fetch image
    const imageResult = await fetchMediaAndSaveImage(
      article.featured_media,
      slug,
    );
    if (!imageResult) {
      console.log(`  Skipping "${slug}" (image fetch failed)`);
      continue;
    }

    // Fetch category
    const rubrique =
      article.categories?.length > 0
        ? await fetchCategory(article.categories[0])
        : null;

    // Process text
    const title = applyFrenchTypography(
      stripHtmlTags(article.title?.rendered || ""),
    );
    const content = applyFrenchTypography(
      htmlToPlainText(article.content?.rendered || ""),
    );
    const legendContent = applyFrenchTypography(
      stripHtmlTags(article.excerpt?.rendered || ""),
    );

    const slidesContent = splitContentIntoSlides(content);

    const fixture: PostFixture = {
      title,
      intro: "",
      rubrique: rubrique || "actu",
      slidesContent,
      position: "top",
      subForMore: true,
      numero: 1,
      format: "post",
      legendContent,
      imageCaption: imageResult.imageCaption,
      articleUrl: article.link || "",
      imageFile: imageResult.imageFile,
    };

    const jsonPath = path.join(FIXTURES_DIR, `${slug}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(fixture, null, 2) + "\n");
    console.log(
      `  -> ${slug}.json + ${imageResult.imageFile} (${slidesContent.length} content slides)`,
    );
    generated++;
  }

  console.log(`\nGenerated ${generated} fixtures in ${FIXTURES_DIR}`);
}

main().catch((err) => {
  console.error("Failed to generate fixtures:", err);
  process.exit(1);
});
