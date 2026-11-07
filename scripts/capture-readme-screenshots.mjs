/**
 * Accurate README imagery captured by Chromium running the REAL GitHub Pages
 * browser edition. No mock screenshots, no promotional compositions.
 *
 * Run by .github/workflows/readme-screenshots.yml.
 */
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "http://127.0.0.1:8765";
const CAPTURE = "docs/screenshots/current";
const SITE = "site";
const errors = [];
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

await mkdir(CAPTURE, { recursive: true });
await mkdir(join(SITE, "assets"), { recursive: true });

async function openPage(url, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 45000 });
  return page;
}

async function appPage(width = 1440, height = 1000) {
  const page = await openPage("/play/", width, height);
  await page.locator("#app .brand-name").first().waitFor({ timeout: 20000 });
  const welcome = page.locator(".welcome-continue");
  if (await welcome.isVisible()) {
    await welcome.click({ timeout: 15000 });
  }
  await page.locator("#app .brand-name").first().waitFor();
  const viewportOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (viewportOverflow > 2) {
    throw new Error(`App overflows the ${width}px viewport by ${viewportOverflow}px`);
  }
  const brand = await page.locator("#app .brand-symbol img").first().getAttribute("src");
  if (!brand || !brand.includes("keystoria-mark.svg")) {
    throw new Error("Expected the current K logo. Actual: " + brand);
  }
  return page;
}

async function shot(page, name, opts = {}) {
  await page.screenshot({
    path: join(CAPTURE, name),
    animations: "disabled",
    fullPage: false,
    ...opts,
  });
  console.log("Captured:", name);
}

try {
  // Real playable browser edition, including the new K logo and practice buttons.
  let page = await appPage(1440, 1000);
  await page.locator('[data-action="speed-open"]').first().waitFor();
  await shot(page, "browser-home-desktop.png");
  await page.screenshot({
    path: join(SITE, "assets", "keystoria-browser-home-current.png"),
    animations: "disabled",
    fullPage: false,
  });
  await page.close();

  // Real lyric controller, running Keystoria's original offline track.
  page = await appPage(1440, 1100);
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator("#lyric-next-keystroke").waitFor({ timeout: 15000 });
  await shot(page, "lyric-lab-desktop.png");
  await page.close();

  // Actual timed typing page (not an illustrative mockup).
  page = await appPage(1440, 1000);
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator("#speed-input").waitFor({ timeout: 15000 });
  await shot(page, "speed-lab-desktop.png");
  await page.close();

  // Actual Linux Field Academy lesson, selected from the homepage.
  page = await appPage(1440, 1000);
  await page.locator('[data-action="learn"][data-os="linux"]').click({ timeout: 20000 });
  await page.locator("#lesson-input").waitFor({ timeout: 15000 });
  await shot(page, "field-academy-desktop.png");
  await page.close();

  // Responsive actual app pages at a phone-sized viewport.
  page = await appPage(390, 844);
  await shot(page, "browser-home-mobile.png");
  await page.close();

  page = await appPage(390, 844);
  await page.locator('[data-action="lyric-open"]').first().click();
  await page.locator('[data-action="lyric-demo"]').click();
  await page.locator("#lyric-next-keystroke").waitFor({ timeout: 15000 });
  await shot(page, "lyric-lab-mobile.png");
  await page.close();

  // Capture the updated portfolio with the current app as its hero screenshot.
  // The website itself is updated to use this newly captured asset after review.
  let html = await readFile(join(SITE, "index.html"), "utf8");
  if (!html.includes('src="assets/keystoria-home-desktop-v024.png"')) {
    throw new Error("Portfolio hero changed; review before replacing imagery");
  }
  html = html.replace(
    'src="assets/keystoria-home-desktop-v024.png"',
    'src="assets/keystoria-browser-home-current.png"'
  );
  await writeFile(join(SITE, "index.html"), html, "utf8");
  page = await openPage("/", 1440, 1000);
  await page.locator(".hero-art img").waitFor({ timeout: 15000 });
  await page.waitForFunction(() =>
    [...document.images].filter(img => img.getAttribute("src")).every(img => img.complete && img.naturalWidth > 0),
    { timeout: 15000 }
  );
  await shot(page, "portfolio-desktop.png");
  await page.close();

  if (errors.length > 0) {
    throw new Error("Unexpected JavaScript errors: " + errors.join(" | "));
  }
  console.log("All screenshots captured from the current application.");
} finally {
  await browser.close();
}
