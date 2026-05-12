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
    const textarea = page
      .locator('[class*="SlideContentEditor"] textarea')
      .first();
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

});
