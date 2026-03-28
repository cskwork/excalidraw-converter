import { test, expect } from "@playwright/test";

// Mock Excalidraw elements that the API would return
const MOCK_ELEMENTS = [
  {
    type: "rectangle",
    id: "rect1abc",
    x: 100,
    y: 100,
    width: 200,
    height: 80,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "#a5d8ff",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: 12345,
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: [{ id: "text1abc", type: "text" }],
    link: null,
    locked: false,
    roundness: { type: 3 },
  },
  {
    type: "text",
    id: "text1abc",
    x: 110,
    y: 128,
    width: 180,
    height: 25,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: 67890,
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    text: "Hello World",
    fontSize: 20,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: "rect1abc",
    originalText: "Hello World",
    autoResize: true,
    lineHeight: 1.25,
  },
  {
    type: "rectangle",
    id: "rect2abc",
    x: 400,
    y: 100,
    width: 200,
    height: 80,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "#b2f2bb",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: 11111,
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: [{ id: "text2abc", type: "text" }],
    link: null,
    locked: false,
    roundness: { type: 3 },
  },
  {
    type: "text",
    id: "text2abc",
    x: 410,
    y: 128,
    width: 180,
    height: 25,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: 22222,
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    text: "Diagram Node",
    fontSize: 20,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: "rect2abc",
    originalText: "Diagram Node",
    autoResize: true,
    lineHeight: 1.25,
  },
  {
    type: "arrow",
    id: "arrow1abc",
    x: 300,
    y: 140,
    width: 100,
    height: 0,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    seed: 33333,
    version: 1,
    isDeleted: false,
    groupIds: [],
    boundElements: null,
    link: null,
    locked: false,
    points: [[0, 0], [100, 0]],
    startBinding: { elementId: "rect1abc", focus: 0, gap: 8 },
    endBinding: { elementId: "rect2abc", focus: 0, gap: 8 },
    startArrowhead: null,
    endArrowhead: "arrow",
    roundness: { type: 2 },
  },
];

test.describe("Diagram Conversion Flow", () => {
  test("text input converts to diagram with mock API", async ({ page }) => {
    // Mock the /api/convert endpoint
    await page.route("**/api/convert", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          elements: MOCK_ELEMENTS,
          summary:
            "Generated diagram with 2 shapes and 1 connection (5 total elements)",
        }),
      });
    });

    await page.goto("/");

    // Wait for Excalidraw to load
    await page.waitForSelector(".excalidraw", { timeout: 15000 });

    // Type text in the textarea
    const textarea = page.locator("textarea");
    await textarea.fill(
      "Create a flowchart showing Hello World connected to Diagram Node"
    );

    // Click Convert button
    const convertBtn = page.locator("button", { hasText: "Convert to Diagram" });
    await expect(convertBtn).toBeEnabled();
    await convertBtn.click();

    // Wait for the summary to appear (proves API was called and elements loaded)
    await expect(
      page.locator("text=Generated diagram with 2 shapes")
    ).toBeVisible({ timeout: 10000 });

    // Verify Excalidraw canvas still visible
    await expect(page.locator(".excalidraw")).toBeVisible();

    // The placeholder should be gone since we have elements now
    await expect(
      page.locator("text=Upload something to generate a diagram")
    ).not.toBeVisible();

    // Take screenshot of the resulting diagram
    await page.screenshot({
      path: "test-results/diagram-result.png",
      fullPage: true,
    });
  });

  test("shows error when API returns error", async ({ page }) => {
    await page.route("**/api/convert", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Claude Agent error: something went wrong",
        }),
      });
    });

    await page.goto("/");
    await page.waitForSelector(".excalidraw", { timeout: 15000 });

    const textarea = page.locator("textarea");
    await textarea.fill("Some text to convert");

    const convertBtn = page.locator("button", { hasText: "Convert to Diagram" });
    await convertBtn.click();

    // Verify error message appears
    await expect(page.locator("text=Claude Agent error")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows loading state during conversion", async ({ page }) => {
    // Slow response to observe loading state
    await page.route("**/api/convert", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ elements: MOCK_ELEMENTS, summary: "Done" }),
      });
    });

    await page.goto("/");
    await page.waitForSelector(".excalidraw", { timeout: 15000 });

    const textarea = page.locator("textarea");
    await textarea.fill("Test loading state");

    const convertBtn = page.locator("button", { hasText: "Convert to Diagram" });
    await convertBtn.click();

    // Verify "Converting..." text appears while loading
    await expect(page.locator("text=Converting...")).toBeVisible({
      timeout: 5000,
    });

    // Wait for completion
    await expect(page.locator("text=Done")).toBeVisible({ timeout: 10000 });
  });
});
