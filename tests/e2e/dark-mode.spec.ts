import { test, expect } from "@playwright/test";

test.describe("Dark Mode", () => {
  test.beforeEach(async ({ page }) => {
    // localStorage 초기화 후 페이지 로드
    await page.goto("/");
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });
  });

  test("defaults to light theme", async ({ page }) => {
    const root = page.locator(".converter-root");
    await expect(root).toHaveAttribute("data-theme", "light");
  });

  test("toggle switches to dark theme", async ({ page }) => {
    const toggleBtn = page.locator("button[aria-label*='dark mode']");
    await toggleBtn.click();

    const root = page.locator(".converter-root");
    await expect(root).toHaveAttribute("data-theme", "dark");
  });

  test("toggle switches back to light theme", async ({ page }) => {
    const toggleBtn = page.locator("button[aria-pressed]");
    // 다크모드로 전환
    await toggleBtn.click();
    await expect(page.locator(".converter-root")).toHaveAttribute("data-theme", "dark");

    // 라이트모드로 복귀
    await toggleBtn.click();
    await expect(page.locator(".converter-root")).toHaveAttribute("data-theme", "light");
  });

  test("dark theme persists across page reload", async ({ page }) => {
    // 다크모드로 전환
    const toggleBtn = page.locator("button[aria-pressed]");
    await toggleBtn.click();
    await expect(page.locator(".converter-root")).toHaveAttribute("data-theme", "dark");

    // 페이지 새로고침
    await page.reload();
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });

    const root = page.locator(".converter-root");
    await expect(root).toHaveAttribute("data-theme", "dark");
  });

  test("toggle icon shows Sun in dark mode (action affordance)", async ({ page }) => {
    // 라이트 모드: Moon 아이콘이 보임 (다크로 전환 가능)
    const toggleBtn = page.locator("button[aria-pressed]");
    await expect(toggleBtn).toContainText("Dark");

    // 다크 모드 전환: Sun 아이콘이 보임 (라이트로 전환 가능)
    await toggleBtn.click();
    await expect(toggleBtn).toContainText("Light");
  });

  test("data-theme syncs to document.documentElement", async ({ page }) => {
    const toggleBtn = page.locator("button[aria-pressed]");
    await toggleBtn.click();

    const htmlTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(htmlTheme).toBe("dark");
  });

  test("sidebar background changes in dark mode", async ({ page }) => {
    const sidebar = page.locator(".converter-sidebar");
    const lightBg = await sidebar.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );

    // 다크모드로 전환 후 data-theme 변경 대기
    const toggleBtn = page.locator("button[aria-pressed]");
    await toggleBtn.click();
    await expect(page.locator(".converter-root")).toHaveAttribute("data-theme", "dark");

    // CSS 트랜지션(150ms) 완료 대기
    await page.waitForFunction(
      (prevBg) => {
        const el = document.querySelector(".converter-sidebar");
        return el && getComputedStyle(el).backgroundColor !== prevBg;
      },
      lightBg,
      { timeout: 3_000 },
    );

    const darkBg = await sidebar.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(lightBg).not.toBe(darkBg);
  });

  test("Excalidraw canvas has dark background in dark mode", async ({ page }) => {
    const toggleBtn = page.locator("button[aria-pressed]");
    await toggleBtn.click();
    await expect(page.locator(".converter-root")).toHaveAttribute("data-theme", "dark");

    // Excalidraw 캔버스 배경색이 어두운 색으로 변경되었는지 확인
    const excalidraw = page.locator(".excalidraw").first();
    await page.waitForFunction(
      () => {
        const el = document.querySelector(".excalidraw");
        if (!el) return false;
        const bg = getComputedStyle(el).getPropertyValue("--island-bg-color");
        // 다크모드에서는 island-bg-color가 어두운 값으로 변경됨
        return bg !== "" && bg !== "#fff" && bg !== "#ffffff";
      },
      undefined,
      { timeout: 5_000 },
    );
    await expect(excalidraw).toBeVisible();
  });

});

test.describe("Dark Mode — System Preference", () => {
  test("respects prefers-color-scheme: dark on first visit", async ({ browser }) => {
    const context = await browser.newContext({
      colorScheme: "dark",
    });
    const page = await context.newPage();

    await page.goto("/");
    await page.waitForSelector(".excalidraw", { timeout: 15_000 });

    const root = page.locator(".converter-root");
    await expect(root).toHaveAttribute("data-theme", "dark");

    await context.close();
  });
});
