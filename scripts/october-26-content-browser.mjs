#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)(process.env.OZ_PLAYWRIGHT_MODULE || "/Users/daibang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");
const publish = path.resolve(process.env.OZ_TEST_PACKAGE || "dist");
const output = path.resolve(process.env.OZ_BROWSER_OUTPUT || "docs/release/cutover-readiness-2026-10-26/content-browser");
fs.mkdirSync(output, { recursive: true });
const routes = ["/oak-flooring-sydney/", "/faqs/", "/timber-floor-installation/", "/engineered-timber-flooring/"];
const report = { startedAt: new Date().toISOString(), mode: "intercepted local GET-only browser; no submissions or external analytics", cells: [], interactions: [], failures: [] };
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== "GET") return route.abort();
      if (url.origin !== "https://oztimberfloor.com.au") return route.abort();
      const relative = decodeURIComponent(url.pathname).slice(1);
      const candidate = [relative || "index.html", `${relative.replace(/\/$/, "")}/index.html`].find((file) => fs.existsSync(path.join(publish, file)) && fs.statSync(path.join(publish, file)).isFile());
      if (!candidate) return route.fulfill({ status: 404, body: "Missing fixture" });
      const file = path.join(publish, candidate);
      const type = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" }[path.extname(file)] || "application/octet-stream";
      return route.fulfill({ status: 200, contentType: type, body: fs.readFileSync(file) });
    });

    for (const route of routes) {
      await page.goto(`https://oztimberfloor.com.au${route}`);
      await page.waitForFunction(() => window.OZ_TIMBER_FLOOR_SITE_READY);
      await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = "auto";
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise((resolve) => setTimeout(resolve, 20)); }
        await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
        scrollTo(0, 0);
      });
      const state = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        brokenImages: [...document.images].filter((image) => image.complete && !image.naturalWidth).map((image) => image.getAttribute("src")),
      }));
      assert.equal(state.h1, 1, route);
      assert.equal(state.overflow, false, route);
      assert.equal(state.brokenImages.length, 0, route);
      assert.equal(errors.length, 0, errors.join("\n"));
      const file = `${width}-${route.replaceAll("/", "_") || "home"}.png`;
      await page.screenshot({ path: path.join(output, file), fullPage: true });
      report.cells.push({ route, width, file, ...state });
    }

    await page.goto("https://oztimberfloor.com.au/faqs/");
    await page.waitForFunction(() => window.OZ_TIMBER_FLOOR_SITE_READY);
    const faqButton = page.locator(".faq-item button").nth(1);
    const before = await faqButton.locator("xpath=..").getAttribute("open");
    await faqButton.focus();
    await page.keyboard.press("Enter");
    const after = await faqButton.locator("xpath=..").getAttribute("open");
    assert.equal(before, null);
    assert.notEqual(after, null);
    report.interactions.push({ width, interaction: "FAQ keyboard expansion", passed: true });

    if (width <= 390) {
      await page.locator(".nav-toggle").click();
      assert.equal(await page.locator(".nav-toggle").getAttribute("aria-expanded"), "true");
      const services = page.locator('.nav-dropdown-toggle[aria-label="Toggle services menu"]');
      const products = page.locator('.nav-dropdown-toggle[aria-label="Toggle products menu"]');
      await services.click();
      assert.equal(await services.getAttribute("aria-expanded"), "true");
      await products.click();
      assert.equal(await products.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      assert.equal(await page.locator(".nav-toggle").getAttribute("aria-expanded"), "false");
      report.interactions.push({ width, interaction: "mobile menu, Services, Products and Escape", passed: true });
    }
    await context.close();
  }
} catch (error) {
  report.failures.push(error.stack || error.message);
} finally {
  await browser.close();
}

report.endedAt = new Date().toISOString();
report.success = report.failures.length === 0;
fs.writeFileSync(path.join(output, "result.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ success: report.success, cells: report.cells.length, interactions: report.interactions.length, failures: report.failures }, null, 2)}\n`);
if (!report.success) process.exitCode = 1;
