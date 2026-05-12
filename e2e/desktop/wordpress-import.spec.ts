import { test, expect } from "../fixtures/app.fixture";

test.describe("WordPress Import", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");

  test("error handling: invalid domain shows error", async ({ app, page }) => {
    await app.gotoNewPost();

    // Enter an invalid WordPress URL (will fail to fetch)
    await page
      .locator('input[type="url"]')
      .fill("https://not-a-real-wordpress-site-12345.example/article");
    await page.locator('button:has-text("Importer")').click();

    // Wait for error to appear (server-side fetch will fail)
    await expect(page.locator('[class*="importError"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test("empty URL shows error", async ({ app, page }) => {
    await app.gotoNewPost();

    // Click import without entering URL
    await page.locator('button:has-text("Importer")').click();

    // Error message should be displayed
    await expect(page.locator('[class*="importError"]')).toBeVisible();
    await expect(page.locator('[class*="importError"]')).toContainText(
      "URL invalide",
    );
  });

  test("loading state shows during import", async ({ app, page }) => {
    await app.gotoNewPost();

    // Enter a URL that will take time to resolve
    await page
      .locator('input[type="url"]')
      .fill("https://wordpress.org/news/some-article");
    await page.locator('button:has-text("Importer")').click();

    // Loading indicator should show immediately
    await expect(page.locator('button:has-text("...")')).toBeVisible();
  });

});
