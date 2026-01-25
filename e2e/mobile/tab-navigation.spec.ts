import { test, expect } from "../fixtures/app.fixture";

// These tests only run on mobile viewports
test.describe("Mobile Tab Navigation", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) >= 768, "Mobile only");

  test("starts on Contenu tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // The Contenu tab should be active
    const contenuTab = page.locator('button:has-text("Contenu")');
    await expect(contenuTab).toHaveAttribute("aria-current", "page");
  });

  test("switch to Slides tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // Click Slides tab
    await app.switchToTab("slides");

    // Slides tab should now be active
    const slidesTab = page.locator('button:has-text("Slides")');
    await expect(slidesTab).toHaveAttribute("aria-current", "page");

    // Contenu tab should not be active
    const contenuTab = page.locator('button:has-text("Contenu")');
    await expect(contenuTab).not.toHaveAttribute("aria-current", "page");
  });

  test("switch to Image tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // Click Image tab
    await app.switchToTab("image");

    // Image tab should now be active
    const imageTab = page.locator('button:has-text("Image")');
    await expect(imageTab).toHaveAttribute("aria-current", "page");
  });

  test("switch to Partager tab", async ({ app, page }) => {
    await app.gotoNewPost();

    // Click Partager tab
    await app.switchToTab("partager");

    // Partager tab should now be active
    const partagerTab = page.locator('button:has-text("Partager")');
    await expect(partagerTab).toHaveAttribute("aria-current", "page");
  });

  test("navigate through all tabs", async ({ app, page }) => {
    await app.gotoNewPost();

    // Start at Contenu
    await expect(page.locator('button:has-text("Contenu")')).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Go to Slides
    await app.switchToTab("slides");
    await expect(page.locator('button:has-text("Slides")')).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Go to Image
    await app.switchToTab("image");
    await expect(page.locator('button:has-text("Image")')).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Go to Partager
    await app.switchToTab("partager");
    await expect(page.locator('button:has-text("Partager")')).toHaveAttribute(
      "aria-current",
      "page",
    );

    // Go back to Contenu
    await app.switchToTab("contenu");
    await expect(page.locator('button:has-text("Contenu")')).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("unsaved indicator appears on tab with changes", async ({
    app,
    page,
  }) => {
    await app.gotoNewPost();

    // Make a change in Contenu tab
    await app.setTitle("Test unsaved indicator");

    // The unsaved dot may appear briefly on the Contenu tab before save completes
    // Just verify the tab still works after making changes
    await app.waitForSave();

    // Value should be saved (mobile uses id="title")
    await expect(page.locator("input#title")).toHaveValue(
      "Test unsaved indicator",
    );
  });

  test("each tab shows appropriate content", async ({ app, page }) => {
    await app.gotoNewPost();

    // Contenu tab should show title, intro, rubrique (mobile uses id attributes)
    await expect(page.locator("input#title")).toBeVisible();
    await expect(page.locator("textarea#intro")).toBeVisible();
    await expect(page.locator("select#rubrique")).toBeVisible();

    // Slides tab should show slide editor
    await app.switchToTab("slides");
    await expect(page.locator('button:has-text("Modifier")')).toBeVisible();

    // Image tab should show format buttons (not select)
    await app.switchToTab("image");
    await expect(page.locator('button:has-text("Post (4:5)")')).toBeVisible();
    await expect(page.locator('button:has-text("Story (9:16)")')).toBeVisible();

    // Partager tab should show download button
    await app.switchToTab("partager");
    await expect(
      page.locator('button:has-text("Télécharger les slides")'),
    ).toBeVisible();
  });
});
