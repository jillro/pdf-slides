import { Page, Route } from "@playwright/test";

export interface MockArticle {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  link: string;
  categories: number[];
  featured_media: number;
}

export interface MockCategory {
  id: number;
  name: string;
  slug: string;
}

export interface MockMedia {
  id: number;
  source_url: string;
  caption: { rendered: string };
}

const defaultArticle: MockArticle = {
  id: 123,
  title: "Test Article Title",
  content: "<p>This is the test article content.</p>",
  excerpt: "This is the test excerpt for the legend.",
  link: "https://example.com/test-article",
  categories: [1],
  featured_media: 456,
};

const defaultCategory: MockCategory = {
  id: 1,
  name: "Actualités",
  slug: "actu",
};

const defaultMedia: MockMedia = {
  id: 456,
  source_url: "https://example.com/test-image.jpg",
  caption: { rendered: "<p>Photo credit: Test Photographer</p>" },
};

// Small transparent PNG as base64 for testing
const TEST_IMAGE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export async function mockWordPressApi(
  page: Page,
  options: {
    article?: Partial<MockArticle>;
    category?: Partial<MockCategory>;
    media?: Partial<MockMedia>;
    shouldFail?: boolean;
    failureMessage?: string;
  } = {},
) {
  const article = { ...defaultArticle, ...options.article };
  const category = { ...defaultCategory, ...options.category };
  const media = { ...defaultMedia, ...options.media };

  // Mock the fetch requests to WordPress API
  await page.route("**/wp-json/wp/v2/posts*", async (route: Route) => {
    if (options.shouldFail) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          message: options.failureMessage || "Not found",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: article.id,
          title: { rendered: article.title },
          content: { rendered: article.content },
          excerpt: { rendered: article.excerpt },
          link: article.link,
          categories: article.categories,
          featured_media: article.featured_media,
        },
      ]),
    });
  });

  await page.route("**/wp-json/wp/v2/categories*", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([category]),
    });
  });

  await page.route("**/wp-json/wp/v2/media/*", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: media.id,
        source_url: media.source_url,
        caption: media.caption,
      }),
    });
  });

  // Mock the actual image fetch
  await page.route("**/test-image.jpg", async (route: Route) => {
    const imageBuffer = Buffer.from(TEST_IMAGE_BASE64.split(",")[1], "base64");
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: imageBuffer,
    });
  });
}

export async function mockWordPressApiError(
  page: Page,
  errorMessage = "Article not found",
) {
  await mockWordPressApi(page, {
    shouldFail: true,
    failureMessage: errorMessage,
  });
}
