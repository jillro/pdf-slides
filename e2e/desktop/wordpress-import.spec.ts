import { test, expect } from "../fixtures/app.fixture";

test.describe("WordPress Import", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");
  // Note: Tests that involve actual WordPress API calls are skipped because
  // the import happens via a Next.js server action, and Playwright's route
  // mocking only intercepts browser-side requests, not server-side fetch calls.

  test.skip("import article populates title and rubrique", async ({
    app,
    page,
  }) => {
    // This test requires actual WordPress API access or server-side mocking
    await app.gotoNewPost();

    await page
      .locator('input[type="url"]')
      .fill("https://example.com/test-article");
    await page.locator('button:has-text("Importer")').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('input[name="title"]')).toHaveValue(
      "Imported Article Title",
    );
  });

  test.skip("import without content checkbox skips slide content", async ({
    app,
    page,
  }) => {
    // This test requires actual WordPress API access
    await app.gotoNewPost();

    const checkbox = page.locator("input#importWithContent");
    await checkbox.uncheck();

    await page.locator('input[type="url"]').fill("https://example.com/test");
    await page.locator('button:has-text("Importer")').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('input[name="title"]')).toHaveValue(
      "Article Without Content Import",
    );
  });

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

  test("import with content checkbox is checked by default", async ({
    app,
    page,
  }) => {
    await app.gotoNewPost();

    const checkbox = page.locator("input#importWithContent");
    await expect(checkbox).toBeChecked();
  });

  test("import UI elements are present", async ({ app, page }) => {
    await app.gotoNewPost();

    // URL input field
    await expect(
      page.locator('input[type="url"][placeholder="URL de l\'article"]'),
    ).toBeVisible();

    // Import button
    await expect(page.locator('button:has-text("Importer")')).toBeVisible();

    // Import with content checkbox
    await expect(page.locator("input#importWithContent")).toBeVisible();
    await expect(
      page.locator('label:has-text("Importer le contenu")'),
    ).toBeVisible();
  });
});
