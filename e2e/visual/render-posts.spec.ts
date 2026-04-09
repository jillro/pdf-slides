import { test } from "../fixtures/app.fixture";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { selectors } from "../helpers/selectors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PostFixture {
  title: string;
  intro: string;
  rubrique: string;
  slidesContent: string[];
  position: "top" | "bottom";
  subForMore: boolean;
  numero: number;
  format: "post" | "story";
  legendContent: string;
  imageCaption: string | null;
  articleUrl: string;
  imageFile: string;
}

const FIXTURES_DIR = path.join(__dirname, "../fixtures/posts");
const OUTPUT_DIR = path.join(__dirname, "../visual-output");

function getFixtures(): { slug: string; fixture: PostFixture }[] {
  if (!fs.existsSync(FIXTURES_DIR)) return [];
  return fs
    .readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const slug = f.replace(".json", "");
      const fixture = JSON.parse(
        fs.readFileSync(path.join(FIXTURES_DIR, f), "utf-8"),
      ) as PostFixture;
      return { slug, fixture };
    });
}

const fixtures = getFixtures();

test.describe("Visual rendering of post slides", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1280) < 768, "Desktop only");
  test.setTimeout(60000);

  for (const { slug, fixture } of fixtures) {
    test(`renders slides for "${slug}"`, async ({ app, page }) => {
      // Create output directory for this article
      const outputDir = path.join(OUTPUT_DIR, slug);
      fs.mkdirSync(outputDir, { recursive: true });

      // Create a new post
      await app.gotoNewPost();

      // Fill in basic fields
      await app.setTitle(fixture.title);
      await app.setIntro(fixture.intro);
      await app.setRubrique(fixture.rubrique);

      if (fixture.format !== "post") {
        await app.setFormat(fixture.format);
      }

      // Upload image
      const imagePath = path.join(FIXTURES_DIR, fixture.imageFile);
      if (fs.existsSync(imagePath)) {
        await app.uploadImage(imagePath);
      }

      // Set position if bottom
      if (fixture.position === "bottom") {
        await page.locator(selectors.desktop.positionBottom).click();
      }

      // Set subscribe for more
      await app.toggleSubscribeForMore(fixture.subForMore);
      if (fixture.subForMore) {
        await app.setNumero(String(fixture.numero));
      }

      // Fill slide content with proper cuts between slides
      await app.setSlideContents(fixture.slidesContent);

      // Wait for save to complete so canvas renders fully
      await app.waitForSave();

      // Wait a bit for canvas rendering
      await page.waitForTimeout(2000);

      // Export slides via Konva API (same as the app's download feature)
      // Sort stages by DOM order to match logical slide order
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const dataUrls = await page.evaluate(() => {
        const Konva = (window as any).Konva;
        if (!Konva?.stages) return [];
        const stages = [...Konva.stages] as any[];
        stages.sort((a: any, b: any) => {
          const posA = a.container().compareDocumentPosition(b.container());
          return posA & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });
        return stages.map((stage: any) => {
          const pixelRatio = 2 / (stage.scaleX() || 1);
          return stage.toDataURL({ pixelRatio });
        });
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */

      for (let i = 0; i < dataUrls.length; i++) {
        const base64 = dataUrls[i].replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(
          path.join(outputDir, `slide-${i}.png`),
          Buffer.from(base64, "base64"),
        );
      }

      console.log(
        `  ${slug}: exported ${dataUrls.length} slides to ${outputDir}`,
      );
    });
  }
});
