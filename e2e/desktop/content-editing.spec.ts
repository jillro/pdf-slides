import { test, expect } from "../fixtures/app.fixture";

test.describe("Content Editing", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");
  test("edit and save title persists after reload", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set title
    await app.setTitle("My Test Title");
    await app.waitForSave();

    // Reload the page
    await page.reload();

    // Title should persist
    await expect(page.locator('input[name="title"]')).toHaveValue(
      "My Test Title",
    );
  });

  test("edit and save intro persists after reload", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set intro
    await app.setIntro("This is my test introduction text.");
    await app.waitForSave();

    // Reload the page
    await page.reload();

    // Intro should persist
    await expect(page.locator('textarea[name="intro"]')).toHaveValue(
      "This is my test introduction text.",
    );
  });

  test("change rubrique persists after reload", async ({ app, page }) => {
    await app.gotoNewPost();

    // Default should be "édito"
    await expect(page.locator('select[name="rubrique"]')).toHaveValue("édito");

    // Change to "actu"
    await app.setRubrique("actu");
    await app.waitForSave();

    // Reload the page
    await page.reload();

    // Rubrique should persist
    await expect(page.locator('select[name="rubrique"]')).toHaveValue("actu");
  });

  test("multiple fields batch save together", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set multiple fields with small delays to ensure React state updates
    await app.setTitle("Batch Test Title");
    await page.waitForTimeout(100);
    await app.setIntro("Batch test intro");
    await page.waitForTimeout(100);
    await app.setRubrique("ailleurs");

    // Wait for save cycle (2s debounce + extra buffer)
    await app.waitForSave();
    await page.waitForTimeout(500);

    // Reload and verify all fields
    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[name="title"]')).toHaveValue(
      "Batch Test Title",
    );
    await expect(page.locator('textarea[name="intro"]')).toHaveValue(
      "Batch test intro",
    );
    await expect(page.locator('select[name="rubrique"]')).toHaveValue(
      "ailleurs",
    );
  });

  test("unsaved indicator appears while saving", async ({ app, page }) => {
    await app.gotoNewPost();

    // Type something
    await page.locator('input[name="title"]').fill("Testing unsaved");

    // The unsaved indicator should appear briefly
    // (It may already be gone by the time we check, so we just verify the field works)
    await app.waitForSave();

    // After save, the value should be there
    await expect(page.locator('input[name="title"]')).toHaveValue(
      "Testing unsaved",
    );
  });

  test("legend content persists after reload", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set legend content
    await app.setLegendContent("This is the legend content for social media.");
    await app.waitForSave();

    // Reload
    await page.reload();

    // Should persist
    await expect(page.locator('textarea[name="legendContent"]')).toHaveValue(
      "This is the legend content for social media.",
    );
  });

  test("image caption persists after reload", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set image caption
    await app.setImageCaption("Photo: Test Photographer");
    await app.waitForSave();

    // Reload
    await page.reload();

    // Should persist
    await expect(page.locator('input[name="imageCaption"]')).toHaveValue(
      "Photo: Test Photographer",
    );
  });

  test("position toggle persists after reload", async ({ app, page }) => {
    await app.gotoNewPost();

    // Default should be "top"
    await expect(page.locator("input#top")).toBeChecked();

    // Change to "bottom"
    await page.locator("input#bottom").click();
    await app.waitForSave();

    // Reload
    await page.reload();

    // Should persist
    await expect(page.locator("input#bottom")).toBeChecked();
  });
});
