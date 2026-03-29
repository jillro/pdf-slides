import { test, expect } from "../fixtures/app.fixture";
import { PNG } from "pngjs";

// Logo color is #FFD9AF
const LOGO_R = 0xff;
const LOGO_G = 0xd9;
const LOGO_B = 0xaf;

function countLogoPixels(
  pngBuffer: Buffer,
): { total: number; dimensions: string } {
  const png = PNG.sync.read(pngBuffer);
  let matchingPixels = 0;

  // Scan the entire image for logo-colored pixels
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

  return { total: matchingPixels, dimensions: `${png.width}x${png.height}` };
}

test.describe("Export logo presence", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");
  test("exported PNG contains the logo on Firefox", async ({ app, page }) => {
    await app.gotoNewPost();
    await app.setTitle("Logo Test");
    await app.waitForSave();

    // Wait for logo to render (useLogoImage rasterizes asynchronously)
    await page.waitForTimeout(2000);

    const downloadPromise = page.waitForEvent("download");
    await page.locator('button:has-text("Télécharger")').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("slide.png");

    // Read the downloaded PNG and check for logo pixels
    const downloadPath = await download.path();
    const fs = await import("fs");
    const pngBuffer = fs.readFileSync(downloadPath!);

    // Save a copy for debugging
    fs.writeFileSync("/tmp/exported-slide.png", pngBuffer);

    const result = countLogoPixels(pngBuffer);

    // The rubrique text "édito" uses the same #FFD9AF color (~1000-2000 pixels).
    // The logo adds significantly more. Desktop exports at smaller scale so
    // fewer total pixels than mobile, but 3000+ indicates logo is present.
    console.log(
      `Logo-colored pixels: ${result.total} in ${result.dimensions} image`,
    );
    expect(
      result.total,
      `Expected 3000+ logo-colored pixels (logo + rubrique text), found only ${result.total} (likely just rubrique text without logo)`,
    ).toBeGreaterThan(3000);
  });
});
