import { test, expect } from "@playwright/test";

test.describe("Input Modes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for Excalidraw to mount before interacting with tabs
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });
  });

  test("default tab is Text — active style applied", async ({ page }) => {
    const textTab = page.locator("button", { hasText: "Text" });
    await expect(textTab).toBeVisible();
    // active 탭은 is-active CSS 클래스를 가짐
    await expect(textTab).toHaveClass(/is-active/);
  });

  test("switch to File tab shows drop zone", async ({ page }) => {
    const fileTab = page.locator("button", { hasText: "File" });
    await fileTab.click();
    const dropZone = page.getByText("Drop a file here");
    await expect(dropZone).toBeVisible();
  });

  test("switch to Image tab shows image drop zone", async ({ page }) => {
    const imageTab = page.locator("button", { hasText: "Image" });
    await imageTab.click();
    const dropZone = page.getByText("Drop an image here");
    await expect(dropZone).toBeVisible();
  });

  test("switch back to Text tab shows textarea", async ({ page }) => {
    // Go to File first
    await page.locator("button", { hasText: "File" }).click();
    // Switch back to Text
    await page.locator("button", { hasText: "Text" }).click();
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
  });

  test("typing text updates character count", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("Hello World");
    // Character count should show "11 characters"
    const charCount = page.getByText("11 characters");
    await expect(charCount).toBeVisible();
  });

  test("convert button is disabled without input", async ({ page }) => {
    const convertBtn = page.locator("button", { hasText: "Convert to Diagram" });
    await expect(convertBtn).toBeDisabled();
    await expect(convertBtn).toHaveClass(/is-disabled/);
  });

  test("convert button is enabled after typing text", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("Some text to convert into a diagram");
    const convertBtn = page.locator("button", { hasText: "Convert to Diagram" });
    await expect(convertBtn).toBeEnabled();
  });
});
