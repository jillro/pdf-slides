import { test, expect } from "../fixtures/app.fixture";

test.describe("Format Selection", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");
  test("default format is post", async ({ app, page }) => {
    await app.gotoNewPost();

    await expect(page.locator('select[name="format"]')).toHaveValue("post");
  });

  test("switch to story format persists after reload", async ({
    app,
    page,
  }) => {
    await app.gotoNewPost();

    // Change to story format
    await app.setFormat("story");
    await app.waitForSave();

    // Reload
    await page.reload();

    // Should persist
    await expect(page.locator('select[name="format"]')).toHaveValue("story");
  });

  test("switch back to post format persists after reload", async ({
    app,
    page,
  }) => {
    await app.gotoNewPost();

    // First switch to story
    await app.setFormat("story");
    await app.waitForSave();

    // Then switch back to post
    await app.setFormat("post");
    await app.waitForSave();

    // Reload
    await page.reload();

    // Should be post
    await expect(page.locator('select[name="format"]')).toHaveValue("post");
  });

  test("format options are available", async ({ app, page }) => {
    await app.gotoNewPost();

    const formatSelect = page.locator('select[name="format"]');

    // Check both options exist
    await expect(formatSelect.locator('option[value="post"]')).toBeAttached();
    await expect(formatSelect.locator('option[value="story"]')).toBeAttached();
  });
});
