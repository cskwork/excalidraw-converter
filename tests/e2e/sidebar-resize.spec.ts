import { test, expect } from "@playwright/test";

test.describe("Sidebar Resize", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });
  });

  test("sidebar default width is approximately 360px", async ({ page }) => {
    const sidebar = page.locator("aside").first();
    const boundingBox = await sidebar.boundingBox();
    expect(boundingBox).not.toBeNull();
    // Allow ±10px tolerance around the 360px default
    expect(boundingBox!.width).toBeGreaterThanOrEqual(350);
    expect(boundingBox!.width).toBeLessThanOrEqual(370);
  });

  test("drag resize handle wider increases sidebar width", async ({ page }) => {
    const resizeHandle = page.locator('[class*="cursor-col-resize"]');
    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    const sidebar = page.locator("aside").first();
    const initialBox = await sidebar.boundingBox();
    expect(initialBox).not.toBeNull();

    // Drag the handle 140px to the right (toward 500px)
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + 140, handleBox!.y + handleBox!.height / 2, { steps: 10 });
    await page.mouse.up();

    const newBox = await sidebar.boundingBox();
    expect(newBox).not.toBeNull();
    expect(newBox!.width).toBeGreaterThan(initialBox!.width);
  });

  test("drag resize handle narrower decreases sidebar width", async ({ page }) => {
    const resizeHandle = page.locator('[class*="cursor-col-resize"]');
    const handleBox = await resizeHandle.boundingBox();
    expect(handleBox).not.toBeNull();

    const sidebar = page.locator("aside").first();
    const initialBox = await sidebar.boundingBox();
    expect(initialBox).not.toBeNull();

    // Drag 80px to the left (toward 280px)
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x - 80, handleBox!.y + handleBox!.height / 2, { steps: 10 });
    await page.mouse.up();

    const newBox = await sidebar.boundingBox();
    expect(newBox).not.toBeNull();
    expect(newBox!.width).toBeLessThan(initialBox!.width);
  });
});
