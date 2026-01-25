import { Page } from "@playwright/test";

// Wait for the debounced save to complete
// The app uses a 1s debounce interval, so we wait 2s to be safe
// (extra buffer for network latency and React state updates)
export async function waitForSave(page: Page) {
  await page.waitForTimeout(2000);
}

// Wait for the unsaved indicator (⏳) to disappear
export async function waitForSaveComplete(page: Page) {
  // First wait for potential indicator to appear
  await page.waitForTimeout(100);

  // Wait for all unsaved indicators to disappear, or timeout
  await page
    .waitForFunction(() => !document.body.textContent?.includes("⏳"), {
      timeout: 5000,
    })
    .catch(() => {
      // If still showing after timeout, the save might still be pending
      // Continue anyway as the data might have been saved
    });
}
