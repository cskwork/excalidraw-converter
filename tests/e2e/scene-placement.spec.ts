import { test, expect, type Page } from "@playwright/test";

/**
 * Regression coverage for how placed scenes reach the canvas:
 * a restored session must actually be drawn after a reload (and must not be
 * overwritten by the next edit), and a scene placed from the mobile panel must
 * be fitted to the canvas once it is shown.
 */

const ELEMENTS_KEY = "excalidraw-converter:elements";

interface DrawnBox {
  /** Bounding box of drawn pixels as fractions of the canvas size (0..1). */
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Bounding box of everything drawn on Excalidraw's static canvas, or null when it is blank. */
async function drawnBox(page: Page): Promise<DrawnBox | null> {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("canvas.excalidraw__canvas.static");
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const bg = [data[0], data[1], data[2]];
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    const step = 2;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const diff = Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]);
        if (diff > 40) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null;
    return { left: minX / width, top: minY / height, width: (maxX - minX) / width, height: (maxY - minY) / height };
  });
}

async function storedCount(page: Page): Promise<number> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const list = JSON.parse(raw) as { isDeleted?: boolean }[];
    return list.filter((el) => !el.isDeleted).length;
  }, ELEMENTS_KEY);
}

/** The drawn diagram fills a good part of the canvas and sits roughly in the middle. */
function expectFitted(box: DrawnBox | null) {
  expect(box, "canvas should not be blank").not.toBeNull();
  const b = box as DrawnBox;
  expect(Math.max(b.width, b.height)).toBeGreaterThan(0.5);
  const centerX = b.left + b.width / 2;
  const centerY = b.top + b.height / 2;
  expect(centerX).toBeGreaterThan(0.3);
  expect(centerX).toBeLessThan(0.7);
  expect(centerY).toBeGreaterThan(0.3);
  expect(centerY).toBeLessThan(0.7);
}

test.describe("Saved session restore", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a reload draws the saved diagram, fitted, and the next edit keeps it", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });
    await page.getByRole("button", { name: "Load sample diagram" }).click();
    await expect(page.getByTestId("status-detail")).toContainText("Sample loaded");
    await expect.poll(() => storedCount(page)).toBeGreaterThan(0);
    const saved = await storedCount(page);

    await page.reload();
    await page.waitForSelector("canvas.excalidraw__canvas.static", { timeout: 15_000 });
    await expect(page.getByText("Upload something to generate a diagram")).not.toBeVisible();
    await expect.poll(async () => (await drawnBox(page)) !== null, { timeout: 10_000 }).toBe(true);
    expectFitted(await drawnBox(page));

    // Drawing one more shape must add to the restored scene, not replace it.
    await page.getByTitle(/^Rectangle/).click();
    const canvas = page.locator("canvas.excalidraw__canvas.interactive");
    const area = await canvas.boundingBox();
    if (!area) throw new Error("interactive canvas not found");
    await page.mouse.move(area.x + area.width - 220, area.y + area.height - 200);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width - 120, area.y + area.height - 130, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => storedCount(page)).toBe(saved + 1);
  });
});

test.describe("Mobile placement", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  test("the sample is fitted once the canvas has been measured, however late that is", async ({ page }) => {
    // Resize observations only arrive with a rendered frame, so a busy or
    // backgrounded tab can deliver them long after any fixed timer. Delay them
    // here to make that ordering deterministic.
    await page.addInitScript(() => {
      const Native = window.ResizeObserver;
      window.ResizeObserver = class extends Native {
        constructor(callback: ResizeObserverCallback) {
          super((entries, observer) => setTimeout(() => callback(entries, observer), 600));
        }
      };
    });
    await page.goto("/");
    await page.waitForSelector(".excalidraw", { state: "attached", timeout: 15_000 });
    await page.getByRole("button", { name: "Load sample diagram" }).click();
    await expect(page.getByRole("tab", { name: "Canvas" })).toHaveAttribute("aria-selected", "true");
    await expect.poll(async () => (await drawnBox(page)) !== null, { timeout: 10_000 }).toBe(true);
    await page.waitForTimeout(500);
    expectFitted(await drawnBox(page));
  });

  test("a restored session is fitted when the canvas is first opened", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".excalidraw", { state: "attached", timeout: 15_000 });
    await page.getByRole("button", { name: "Load sample diagram" }).click();
    await expect.poll(() => storedCount(page)).toBeGreaterThan(0);

    await page.reload();
    await page.waitForSelector(".excalidraw", { state: "attached", timeout: 15_000 });
    await expect(page.getByRole("tab", { name: "Panel" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Canvas" }).click();
    await expect.poll(async () => (await drawnBox(page)) !== null, { timeout: 10_000 }).toBe(true);
    await page.waitForTimeout(500);
    expectFitted(await drawnBox(page));
  });
});
