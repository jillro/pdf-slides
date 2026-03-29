import { test, expect } from "../fixtures/app.fixture";
import { PNG } from "pngjs";

// Logo color is #FFD9AF
const LOGO_R = 0xff;
const LOGO_G = 0xd9;
const LOGO_B = 0xaf;

function countLogoPixels(pngBuffer: Buffer): number {
  const png = PNG.sync.read(pngBuffer);
  let matchingPixels = 0;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) * 4;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];
      if (
        a > 128 &&
        Math.abs(r - LOGO_R) < 30 &&
        Math.abs(g - LOGO_G) < 30 &&
        Math.abs(b - LOGO_B) < 30
      ) {
        matchingPixels++;
      }
    }
  }

  return matchingPixels;
}

test.describe("Mobile export logo presence", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) >= 768, "Mobile only");

  test("exported PNG contains the logo", async ({ app, page }) => {
    await app.gotoNewPost();

    // Set title on mobile (Contenu tab is default)
    await app.setTitle("Mobile Logo Test");
    await app.waitForSave();

    // Switch to Partager tab where download button is
    await app.switchToTab("partager");

    // Wait for logo to render
    await page.waitForTimeout(2000);

    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent("download", { timeout: 30000 });

    // Click mobile download button
    await page.locator('button:has-text("Télécharger les slides")').click();

    // Wait for download
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("slide.png");

    // Read the downloaded PNG and check for logo pixels
    const downloadPath = await download.path();
    const fs = await import("fs");
    const pngBuffer = fs.readFileSync(downloadPath!);

    // Save for debugging
    fs.writeFileSync("/tmp/exported-slide-mobile.png", pngBuffer);

    const logoPixels = countLogoPixels(pngBuffer);

    // The rubrique text "édito" uses the same #FFD9AF color.
    // Without the logo, we get ~2000-4000 pixels from just the text.
    // With the logo, we get significantly more (8000+).
    // Use 6000 as a threshold that clearly distinguishes the two cases.
    console.log(`Logo-colored pixels found: ${logoPixels}`);
    expect(
      logoPixels,
      `Expected 6000+ logo-colored pixels (logo + rubrique text), found only ${logoPixels} (likely just rubrique text without logo)`,
    ).toBeGreaterThan(6000);
  });
});
