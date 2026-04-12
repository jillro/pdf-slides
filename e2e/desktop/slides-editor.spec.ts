import { test, expect } from "../fixtures/app.fixture";

test.describe("Slides Editor", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");

  test("add content persists after reload", async ({ app, page }) => {
    await app.gotoNewPost();

    const textarea = page
      .locator('[class*="SlideContentEditor"] textarea')
      .first();
    await textarea.fill("This is my slide content.");

    await app.waitForSave();
    await app.reload();

    await expect(
      page.locator('[class*="SlideContentEditor"] textarea').first(),
    ).toHaveValue("This is my slide content.");
  });

  test("splitting creates a new section", async ({ app, page }) => {
    await app.gotoNewPost();

    await app.setSlideContents(["Part one.", "Part two."]);
    await app.waitForSave();

    const textareas = page.locator('[class*="SlideContentEditor"] textarea');
    await expect(textareas).toHaveCount(2);
    await expect(textareas.nth(0)).toHaveValue("Part one.");
    await expect(textareas.nth(1)).toHaveValue("Part two.");
  });

  test("navigate slides with prev/next buttons", async ({ app, page }) => {
    await app.gotoNewPost();

    await page
      .locator('[class*="SlideContentEditor"] textarea')
      .first()
      .fill("First part of content");
    await app.waitForSave();

    // Enable subscribe for more to have at least 2 slides total
    await page.locator("input#subscribeformore").check();
    await app.waitForSave();

    const nextButton = page.locator('button:has-text(">")').first();
    await expect(nextButton).toBeVisible();

    await nextButton.click();

    const prevButton = page.locator('button:has-text("<")').first();
    await expect(prevButton).toBeVisible({ timeout: 10000 });

    await prevButton.click();

    await expect(prevButton).not.toBeVisible({ timeout: 5000 });
  });

  test("multi-section content persists after reload", async ({ app, page }) => {
    await app.gotoNewPost();

    await app.setSlideContents(["Part one.", "Part two."]);
    await app.waitForSave();

    await app.reload();

    const textareas = page.locator('[class*="SlideContentEditor"] textarea');
    await expect(textareas).toHaveCount(2);
    await expect(textareas.nth(0)).toHaveValue("Part one.");
    await expect(textareas.nth(1)).toHaveValue("Part two.");
  });

  test("empty content results in single slide", async ({ app, page }) => {
    await app.gotoNewPost();

    // With empty content and no subscribe slide
    // There should be no navigation buttons
    const nextButton = page.locator('button[class*="canvasNext"]');
    const prevButton = page.locator('button[class*="canvasPrev"]');

    await expect(nextButton).not.toBeVisible();
    await expect(prevButton).not.toBeVisible();
  });
});
