import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.goto("/");
  await page.waitForSelector(".excalidraw", { timeout: 15_000 });
}

test.describe("Hosted-demo fallback", () => {
  test("a generic 500 explains the engine is unavailable and offers the sample", async ({ page }) => {
    await page.route("**/api/convert", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Internal server error" }) }),
    );
    await ready(page);
    await page.locator("textarea").fill("Two boxes connected by an arrow");
    await page.getByRole("button", { name: "Convert to Diagram" }).click();

    // Next.js adds its own route-announcer alert, so filter to ours.
    const alert = page.getByRole("alert").filter({ hasText: "conversion engine isn't reachable" });
    await expect(alert).toBeVisible();
    await alert.getByRole("button", { name: "Try the sample instead" }).click();

    await expect(page.getByTestId("status-detail")).toContainText("Sample loaded");
    await expect(page.getByText("Upload something to generate a diagram")).not.toBeVisible();
  });

  test("the sample diagram survives a reload", async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: "Load sample diagram" }).click();
    await expect(page.getByTestId("status-detail")).toContainText("Sample loaded");
    await expect(page.getByText("Upload something to generate a diagram")).not.toBeVisible();

    await page.waitForTimeout(600); // debounced save
    await page.reload();
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });
    await expect(page.getByText("Upload something to generate a diagram")).not.toBeVisible();
  });
});

test.describe("Input shortcuts", () => {
  test("an example cell fills the description and enables Convert", async ({ page }) => {
    await ready(page);
    await page.getByRole("button", { name: /Checkout/ }).click();
    await expect(page.locator("textarea")).toHaveValue(/online checkout/);
    await expect(page.getByRole("button", { name: "Convert to Diagram" })).toBeEnabled();
  });

  test("Ctrl+Enter converts from the text field", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/convert", (route) => {
      calls += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ elements: [], summary: "Keyboard run" }) });
    });
    await ready(page);
    await page.locator("textarea").fill("A to B");
    await page.locator("textarea").press("Control+Enter");
    await expect(page.getByTestId("status-detail")).toHaveText("Keyboard run");
    expect(calls).toBe(1);
  });

  test("a running conversion can be cancelled", async ({ page }) => {
    await page.route("**/api/convert", async (route) => {
      await new Promise((r) => setTimeout(r, 5_000));
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" }).catch(() => undefined);
    });
    await ready(page);
    await page.locator("textarea").fill("Slow request");
    await page.getByRole("button", { name: "Convert to Diagram" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Conversion cancelled." })).toBeVisible();
  });

  test("mode keys follow the tabs pattern with arrow keys", async ({ page }) => {
    await ready(page);
    const textTab = page.getByRole("tab", { name: "Text" });
    await textTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "File" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Drop a file here")).toBeVisible();
  });

  test("an unsupported document is rejected before upload", async ({ page }) => {
    await ready(page);
    await page.getByRole("tab", { name: "File" }).click();
    await page.locator("input[type=file]").setInputFiles({ name: "deck.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
    await expect(page.getByRole("alert").filter({ hasText: "Unsupported format" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Convert to Diagram" })).toBeDisabled();
  });

  test("the panel resizes from the keyboard", async ({ page }) => {
    await ready(page);
    const handle = page.getByRole("separator", { name: "Resize panel" });
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await expect(handle).toHaveAttribute("aria-valuenow", "376");
  });
});

test.describe("Mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("panel and canvas switch, and a loaded diagram opens the canvas", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".excalidraw", { state: "attached", timeout: 15_000 });
    const views = page.getByRole("tablist", { name: "View" });
    await expect(views).toBeVisible();
    await expect(page.getByRole("tab", { name: "Panel" })).toHaveAttribute("aria-selected", "true");

    await page.getByRole("button", { name: "Load sample diagram" }).click();
    await expect(page.getByRole("tab", { name: "Canvas" })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("aside")).toBeHidden();
    await expect(page.locator(".excalidraw").first()).toBeVisible();

    await page.getByRole("tab", { name: "Panel" }).click();
    await expect(page.locator("aside")).toBeVisible();
  });
});
