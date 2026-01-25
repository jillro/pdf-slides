import { test as base, expect } from "@playwright/test";
import { selectors } from "../helpers/selectors";
import { waitForSave, waitForSaveComplete } from "../helpers/wait-for-save";

// Extended test fixture with app helpers
export interface AppHelpers {
  // Navigation
  goto: (id?: string) => Promise<void>;
  gotoNewPost: () => Promise<string>;

  // Desktop form helpers
  setTitle: (value: string) => Promise<void>;
  setIntro: (value: string) => Promise<void>;
  setRubrique: (value: string) => Promise<void>;
  setFormat: (value: "post" | "story") => Promise<void>;
  setLegendContent: (value: string) => Promise<void>;
  setImageCaption: (value: string) => Promise<void>;
  toggleSubscribeForMore: (checked: boolean) => Promise<void>;
  setNumero: (value: string) => Promise<void>;

  // Slide content
  setSlideContent: (value: string) => Promise<void>;

  // Image upload
  uploadImage: (path: string) => Promise<void>;

  // Download
  download: () => Promise<void>;

  // Mobile helpers
  switchToTab: (
    tab: "contenu" | "slides" | "image" | "partager",
  ) => Promise<void>;

  // Wait helpers
  waitForSave: () => Promise<void>;
  waitForSaveComplete: () => Promise<void>;

  // Viewport detection
  isMobile: () => boolean;
}

export const test = base.extend<{ app: AppHelpers }>({
  app: async ({ page, viewport }, use) => {
    const isMobile = () => (viewport?.width ?? 1280) < 768;

    const helpers: AppHelpers = {
      goto: async (id?: string) => {
        if (id) {
          await page.goto(`/${id}`);
        } else {
          await page.goto("/");
        }
        // Wait for the page to fully load
        await page.waitForLoadState("networkidle");
      },

      gotoNewPost: async () => {
        await page.goto("/");
        // Wait for redirect to post page (ID is alphanumeric, 1+ chars)
        await page.waitForURL(/\/[a-z0-9]+$/i, { timeout: 30000 });
        // Wait for page to be fully loaded
        await page.waitForLoadState("networkidle");
        // Extract the ID from the URL
        const url = page.url();
        const id = url.split("/").pop() || "";
        return id;
      },

      setTitle: async (value: string) => {
        const selector = isMobile()
          ? selectors.mobile.title
          : selectors.desktop.title;
        await page.locator(selector).fill(value);
      },

      setIntro: async (value: string) => {
        const selector = isMobile()
          ? selectors.mobile.intro
          : selectors.desktop.intro;
        await page.locator(selector).fill(value);
      },

      setRubrique: async (value: string) => {
        const selector = isMobile()
          ? selectors.mobile.rubrique
          : selectors.desktop.rubrique;
        await page.locator(selector).selectOption(value);
      },

      setFormat: async (value: "post" | "story") => {
        if (isMobile()) {
          // Mobile uses buttons for format selection
          const buttonText = value === "post" ? "Post (4:5)" : "Story (9:16)";
          await page.locator(`button:has-text("${buttonText}")`).click();
        } else {
          await page.locator(selectors.desktop.format).selectOption(value);
        }
      },

      setLegendContent: async (value: string) => {
        await page.locator(selectors.desktop.legendContent).fill(value);
      },

      setImageCaption: async (value: string) => {
        await page.locator(selectors.desktop.imageCaption).fill(value);
      },

      toggleSubscribeForMore: async (checked: boolean) => {
        const checkbox = page.locator(selectors.desktop.subscribeForMore);
        const isChecked = await checkbox.isChecked();
        if (isChecked !== checked) {
          await checkbox.click();
        }
      },

      setNumero: async (value: string) => {
        await page.locator(selectors.desktop.numero).fill(value);
      },

      setSlideContent: async (value: string) => {
        // Ensure we're in edit mode
        await page.locator(selectors.desktop.editModeButton).click();
        await page.locator(selectors.desktop.slideTextarea).fill(value);
      },

      uploadImage: async (path: string) => {
        const selector = isMobile()
          ? 'input[type="file"][accept="image/*"]'
          : selectors.desktop.image;
        await page.locator(selector).setInputFiles(path);
      },

      download: async () => {
        const selector = isMobile()
          ? selectors.mobile.downloadButton
          : selectors.desktop.downloadButton;
        await page.locator(selector).click();
      },

      switchToTab: async (tab: "contenu" | "slides" | "image" | "partager") => {
        if (!isMobile()) {
          return; // No tabs on desktop
        }
        const tabSelectors = {
          contenu: selectors.mobile.tabContenu,
          slides: selectors.mobile.tabSlides,
          image: selectors.mobile.tabImage,
          partager: selectors.mobile.tabPartager,
        };
        await page.locator(tabSelectors[tab]).click();
      },

      waitForSave: async () => {
        await waitForSave(page);
      },

      waitForSaveComplete: async () => {
        await waitForSaveComplete(page);
      },

      isMobile,
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(helpers);
  },
});

export { expect };
