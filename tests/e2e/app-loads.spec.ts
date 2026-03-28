import { test, expect } from "@playwright/test";

test.describe("App Loading", () => {
  test("page loads with title containing Excalidraw", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Excalidraw/);
  });

  test("sidebar heading is visible", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { name: "Excalidraw Converter" });
    await expect(heading).toBeVisible();
  });

  test("subtitle is visible", async ({ page }) => {
    await page.goto("/");
    const subtitle = page.getByText("Turn anything into editable diagrams");
    await expect(subtitle).toBeVisible();
  });

  test("Excalidraw canvas renders in the right panel", async ({ page }) => {
    await page.goto("/");
    // Excalidraw is loaded dynamically (SSR disabled); give it time to mount
    const excalidrawContainer = page.locator(".excalidraw").first();
    await expect(excalidrawContainer).toBeVisible({ timeout: 15_000 });
  });

  test("placeholder text is visible when no elements are loaded", async ({
    page,
  }) => {
    await page.goto("/");
    const placeholder = page.getByText("Upload something to generate a diagram");
    await expect(placeholder).toBeVisible({ timeout: 15_000 });
  });

  test("no login button exists (OAuth removed)", async ({ page }) => {
    await page.goto("/");
    // Wait for page to be fully interactive before asserting absence
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });
    const loginButton = page.getByText("Login");
    await expect(loginButton).not.toBeVisible();
  });

  test("resize handle is visible between sidebar and canvas", async ({
    page,
  }) => {
    await page.goto("/");
    // GripVertical icon is rendered inside the resize handle div
    // The resize handle has cursor-col-resize styling and contains an svg
    const resizeHandle = page.locator('[class*="cursor-col-resize"]');
    await expect(resizeHandle).toBeVisible({ timeout: 10_000 });
  });
});
