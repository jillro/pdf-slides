import { test, expect } from "../fixtures/app.fixture";

test.describe("Download", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");
  test("single slide downloads as PNG", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set up a simple post with just title (no extra slides)
    await app.setTitle("Download Test");
    await app.waitForSave();

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click download
    await page.locator('button:has-text("Télécharger")').click();

    // Wait for download
    const download = await downloadPromise;

    // Should be a PNG file
    expect(download.suggestedFilename()).toBe("slide.png");
  });

  test("multiple slides download as ZIP", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set up a post with subscribe slide enabled
    await app.setTitle("Multi-slide Test");
    await page.locator("input#subscribeformore").check();
    await app.waitForSave();

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click download
    await page.locator('button:has-text("Télécharger")').click();

    // Wait for download
    const download = await downloadPromise;

    // Should be a ZIP file
    expect(download.suggestedFilename()).toBe("slides.zip");
  });

  test("slides with content download as ZIP", async ({ app, page }) => {
    await app.gotoNewPost();

    // Add slide content
    await page.locator('button:has-text("Modifier")').click();
    const textarea = page.locator('[class*="SlideContentEditor"] textarea');
    await textarea.fill("Content that creates additional slides.");
    await app.waitForSave();

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click download
    await page.locator('button:has-text("Télécharger")').click();

    // Wait for download
    const download = await downloadPromise;

    // Should be a ZIP file (first slide + content slide)
    expect(download.suggestedFilename()).toBe("slides.zip");
  });

  test("download button is always visible", async ({ app, page }) => {
    await app.gotoNewPost();

    // Download button should be visible on desktop
    const downloadButton = page.locator('button:has-text("Télécharger")');
    await expect(downloadButton).toBeVisible();
  });

  test("subscribe slide option creates additional slide", async ({
    app,
    page,
  }) => {
    await app.gotoNewPost();

    // Initially, with no content and no subscribe, single slide
    const nextButton = page.locator('button[class*="canvasNext"]');
    await expect(nextButton).not.toBeVisible();

    // Enable subscribe for more
    await page.locator("input#subscribeformore").check();
    await app.waitForSave();

    // Now navigation should be available
    await expect(nextButton).toBeVisible();
  });

  test("numero field appears when subscribe is enabled", async ({
    app,
    page,
  }) => {
    await app.gotoNewPost();

    // Numero field should not be visible initially
    const numeroField = page.locator("input#numero");
    await expect(numeroField).not.toBeVisible();

    // Enable subscribe
    await page.locator("input#subscribeformore").check();

    // Numero field should now be visible
    await expect(numeroField).toBeVisible();

    // Set a value
    await numeroField.fill("42");
    await app.waitForSave();

    // Reload and verify
    await page.reload();
    await expect(page.locator("input#numero")).toHaveValue("42");
  });
});
