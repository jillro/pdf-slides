import { test, expect } from "../fixtures/app.fixture";

// These tests only run on mobile viewports
test.describe("Mobile Content Editing", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) >= 768, "Mobile only");

  test("edit title on Contenu tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // Should be on Contenu tab by default
    await app.setTitle("Mobile Title Test");
    await app.waitForSave();

    // Reload and verify (mobile uses id="title")
    await page.reload();
    await expect(page.locator("input#title")).toHaveValue("Mobile Title Test");
  });

  test("edit intro on Contenu tab", async ({ app, page }) => {
    await app.gotoNewPost();

    await app.setIntro("Mobile intro text for testing.");
    await app.waitForSave();

    // Reload and verify (mobile uses id="intro")
    await page.reload();
    await expect(page.locator("textarea#intro")).toHaveValue(
      "Mobile intro text for testing.",
    );
  });

  test("edit rubrique on Contenu tab", async ({ app, page }) => {
    await app.gotoNewPost();

    await app.setRubrique("pop !");
    await app.waitForSave();

    // Reload and verify (mobile uses id="rubrique")
    await page.reload();
    await expect(page.locator("select#rubrique")).toHaveValue("pop !");
  });

  test("edit format on Image tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // Switch to Image tab
    await app.switchToTab("image");

    // Change format (uses buttons on mobile)
    await app.setFormat("story");
    await app.waitForSave();

    // Reload and verify - check the Story button has active class
    await page.reload();
    await app.switchToTab("image");
    await expect(page.locator('button:has-text("Story (9:16)")')).toHaveClass(
      /active/,
    );
  });

  test("download from Partager tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set up some content
    await app.setTitle("Mobile Download Test");
    await app.waitForSave();

    // Switch to Partager tab
    await app.switchToTab("partager");

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click download (mobile uses different text)
    await page.locator('button:has-text("Télécharger les slides")').click();

    // Wait for download
    const download = await downloadPromise;

    // Should download a file
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test("enable subscribe for more on Partager tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // Switch to Partager tab
    await app.switchToTab("partager");

    // Enable subscribe for more
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await app.waitForSave();

    // Reload and verify
    await page.reload();
    await app.switchToTab("partager");
    await expect(checkbox).toBeChecked();
  });

  test("edit slides on Slides tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // Switch to Slides tab
    await app.switchToTab("slides");

    // Add content
    await page.locator('button:has-text("Modifier")').click();
    const textarea = page.locator("textarea");
    await textarea.fill("Mobile slide content test.");
    await app.waitForSave();

    // Reload and verify
    await page.reload();
    await app.switchToTab("slides");
    await page.locator('button:has-text("Modifier")').click();
    await expect(page.locator("textarea")).toHaveValue(
      "Mobile slide content test.",
    );
  });

  test("changes on one tab persist when switching tabs", async ({
    app,
    page,
  }) => {
    await app.gotoNewPost();

    // Make changes on Contenu tab
    await app.setTitle("Persistent Title");

    // Switch to another tab and back
    await app.switchToTab("image");
    await app.switchToTab("contenu");

    // Title should still be there (mobile uses id="title")
    await expect(page.locator("input#title")).toHaveValue("Persistent Title");
  });

  test("multiple tabs can have changes", async ({ app, page }) => {
    await app.gotoNewPost();

    // Change title on Contenu tab
    await app.setTitle("Multi-tab Test");

    // Change format on Image tab
    await app.switchToTab("image");
    await app.setFormat("story");

    await app.waitForSave();

    // Reload and verify both
    await page.reload();

    // Check Contenu tab (mobile uses id="title")
    await expect(page.locator("input#title")).toHaveValue("Multi-tab Test");

    // Check Image tab - Story button should be active
    await app.switchToTab("image");
    await expect(page.locator('button:has-text("Story (9:16)")')).toHaveClass(
      /active/,
    );
  });
});
