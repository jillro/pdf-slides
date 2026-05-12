import { test, expect } from "../fixtures/app.fixture";

test.describe("Format Selection", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");

  test("switch to story format persists after reload", async ({
    app,
    page,
  }) => {
    await app.gotoNewPost();

    // Change to story format
    await app.setFormat("story");
    await app.waitForSave();

    // Reload
    await app.reload();

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
    await app.reload();

    // Should be post
    await expect(page.locator('select[name="format"]')).toHaveValue("post");
  });
});
