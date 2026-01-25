import { test, expect } from "../fixtures/app.fixture";

test.describe("Navigation", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");
  test("home page redirects to a random post ID", async ({ page }) => {
    await page.goto("/");

    // Should redirect to /{randomId}
    await page.waitForURL(/\/[a-z0-9]+$/i);

    const url = page.url();
    const id = url.split("/").pop();

    expect(id).toBeTruthy();
    // ID is generated via Math.random().toString(36).substring(7)
    // which can be 1-6 characters
    expect(id?.length).toBeGreaterThanOrEqual(1);
  });

  test("direct ID access loads the post", async ({ app, page }) => {
    // First create a post
    const id = await app.gotoNewPost();

    // Navigate away and come back
    await page.goto("/");
    await page.waitForURL(/\/[a-z0-9]+$/i);

    // Now navigate directly to the original ID
    await page.goto(`/${id}`);

    // Should load successfully (page contains the editor)
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test("new post has empty default state", async ({ app, page }) => {
    await app.gotoNewPost();

    // Title should be empty
    await expect(page.locator('input[name="title"]')).toHaveValue("");

    // Intro should be empty
    await expect(page.locator('textarea[name="intro"]')).toHaveValue("");

    // Rubrique should have default value
    await expect(page.locator('select[name="rubrique"]')).toHaveValue("édito");

    // Format should have default value
    await expect(page.locator('select[name="format"]')).toHaveValue("post");
  });

  test("different post IDs create separate posts", async ({ app, page }) => {
    // Create first post and set a title
    const id1 = await app.gotoNewPost();
    await app.setTitle("First Post Title");
    await app.waitForSave();

    // Create second post
    await page.goto("/");
    await page.waitForURL(/\/[a-z0-9]+$/i);
    const url = page.url();
    const id2 = url.split("/").pop();

    // IDs should be different
    expect(id1).not.toBe(id2);

    // Second post should have empty title
    await expect(page.locator('input[name="title"]')).toHaveValue("");

    // Go back to first post
    await page.goto(`/${id1}`);
    await expect(page.locator('input[name="title"]')).toHaveValue(
      "First Post Title",
    );
  });
});
