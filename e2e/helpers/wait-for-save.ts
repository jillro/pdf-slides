import { Page } from "@playwright/test";

// Wait for the debounced save to complete
// The app uses a 1s debounce interval, so we wait 2s to be safe
// (extra buffer for network latency and React state updates)
export async function waitForSave(page: Page) {
  await page.waitForTimeout(2000);
}

// Wait for the unsaved indicator (⏳) to disappear
export async function waitForSaveComplete(page: Page) {
  // The app uses a 1s interval to check for changes and save them.
  // We must wait for at least one full interval cycle to ensure the save triggers.
  await page.waitForTimeout(1200);

  // Then wait for any ⏳ indicators to disappear (save completed)
  await page.waitForFunction(
    () => !document.body.textContent?.includes("⏳"),
    { timeout: 5000 },
  );
}
