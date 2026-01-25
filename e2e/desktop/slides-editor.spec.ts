import { test, expect } from "../fixtures/app.fixture";

test.describe("Slides Editor", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");
  test("add content in edit mode", async ({ app, page }) => {
    await app.gotoNewPost();

    // Click edit mode button
    await page.locator('button:has-text("Modifier")').click();

    // Find the textarea and add content
    const textarea = page.locator('[class*="SlideContentEditor"] textarea');
    await textarea.fill("This is my slide content.");

    await app.waitForSave();

    // Reload and verify
    await page.reload();
    await page.locator('button:has-text("Modifier")').click();

    await expect(
      page.locator('[class*="SlideContentEditor"] textarea'),
    ).toHaveValue("This is my slide content.");
  });

  test("switch between edit and cut-copy modes", async ({ app, page }) => {
    await app.gotoNewPost();

    // Start in edit mode
    await page.locator('button:has-text("Modifier")').click();
    const editButton = page.locator('button:has-text("Modifier")');
    await expect(editButton).toHaveClass(/active/);

    // Add some content first
    const textarea = page.locator('[class*="SlideContentEditor"] textarea');
    await textarea.fill("Content for testing mode switch.");

    // Switch to cut-copy mode
    await page.locator('button:has-text("Couper/Copier")').click();
    const cutCopyButton = page.locator('button:has-text("Couper/Copier")');
    await expect(cutCopyButton).toHaveClass(/active/);

    // Switch back to edit mode
    await page.locator('button:has-text("Modifier")').click();
    await expect(editButton).toHaveClass(/active/);

    // Content should still be there
    await expect(textarea).toHaveValue("Content for testing mode switch.");
  });

  test("navigate slides with prev/next buttons", async ({ app, page }) => {
    await app.gotoNewPost();

    // Add content that will create multiple slides
    await page.locator('button:has-text("Modifier")').click();
    const textarea = page.locator('[class*="SlideContentEditor"] textarea');
    await textarea.fill("First part of content");
    await app.waitForSave();

    // Enable subscribe for more to have at least 2 slides total
    await page.locator("input#subscribeformore").check();
    await app.waitForSave();

    // Now we should have navigation buttons
    // The next button should be visible (uses > character)
    const nextButton = page.locator('button:has-text(">")').first();
    await expect(nextButton).toBeVisible();

    // Click next to go to next slide
    await nextButton.click();

    // After clicking next, prev button should be visible (uses < character)
    const prevButton = page.locator('button:has-text("<")').first();
    await expect(prevButton).toBeVisible({ timeout: 10000 });

    // Click prev to go back to first slide
    await prevButton.click();

    // After going back to first slide, prev should be hidden
    await expect(prevButton).not.toBeVisible({ timeout: 5000 });
  });

  test("content persists with slide cuts", async ({ app, page }) => {
    await app.gotoNewPost();

    // Add content
    await page.locator('button:has-text("Modifier")').click();
    const textarea = page.locator('[class*="SlideContentEditor"] textarea');
    await textarea.fill("Part one of the content. Part two of the content.");
    await app.waitForSave();

    // Reload and verify content is still there
    await page.reload();
    await page.locator('button:has-text("Modifier")').click();

    await expect(
      page.locator('[class*="SlideContentEditor"] textarea'),
    ).toHaveValue("Part one of the content. Part two of the content.");
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
