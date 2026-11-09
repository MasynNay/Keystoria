/**
 * Keystoria's 15-theme browser regression. Tests real DOM, CSS, persistence,
 * scene selection, and each playable practice mode.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = "http://127.0.0.1:8765";
const { THEMES: themes } = await import("../app/web/ui/themes.js");
const ids = themes.map(t=>t.id);
const errors=[];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const check=async (page)=>{
  assert.equal(await page.locator(".theme-choice").count(),15,"15 choices must be in the settings dialog");
  for(const theme of themes){
    await page.locator('.theme-choice[data-theme-id="'+theme.id+'"]').click();
    const attr=await page.locator("body").getAttribute("data-ui-theme");
    assert.equal(attr,theme.id,"theme selection must update body");
    assert.equal(await page.locator('.theme-choice[aria-pressed="true"]').count(),1,"exactly one theme selected");
    assert.equal(await page.locator('.theme-choice[aria-pressed="true"]').getAttribute("data-theme-id"),theme.id);
    const actual=await page.evaluate(()=>{
      const body=getComputedStyle(document.body);
      return {accent:body.getPropertyValue("--accent").trim(),background:body.getPropertyValue("--background").trim(),stored:JSON.parse(localStorage.getItem("panic.preferences.v1")).theme};
    });
    assert.equal(actual.accent,theme.accent);
    assert.equal(actual.background,theme.bg);
    assert.equal(actual.stored,theme.id);
  }
};
const open=async(page)=>{await page.locator(".prefs-toggle").first().click();await page.locator(".theme-picker").waitFor();};
const close=async(page)=>{await page.locator('.settings-modal button[data-action="close-modal"]').last().click();};
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  page.on("pageerror",err=>errors.push(String(err)));
  await page.goto(base+"/play/",{waitUntil:"domcontentloaded"});
  await page.locator("#app .brand-name").waitFor();
  if(await page.locator(".welcome-continue").isVisible())await page.locator(".welcome-continue").click();
  await open(page);
  await check(page);
  await close(page);
  // Mission-colored art and user color schemes are independent.
  await page.locator('[data-action="choose-mission"][data-mission="hollow"]').first().click();
  assert.equal(await page.locator("body").getAttribute("data-theme"),"hollow");
  assert.equal(await page.locator("body").getAttribute("data-ui-theme"),"noir");
  await page.reload({waitUntil:"domcontentloaded"});
  if(await page.locator(".welcome-continue").isVisible())await page.locator(".welcome-continue").click();
  assert.equal(await page.locator("body").getAttribute("data-ui-theme"),"noir","theme must survive reload");
  // Test settings from Speed Lab.
  await page.locator('[data-action="speed-open"]').first().click();
  await page.locator("#speed-input").waitFor();
  await open(page);
  await page.locator('.theme-choice[data-theme-id="aurora"]').click();
  assert.equal(await page.locator("body").getAttribute("data-ui-theme"),"aurora");
  await close(page);
  await page.locator("#speed-input").fill("typing practice still works");
  assert.equal(await page.locator("#speed-input").inputValue(),"typing practice still works");
  // New page: Lyric Lab retains theme from same browser storage (same context).
  const lyric=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  lyric.on("pageerror",err=>errors.push(String(err)));
  await lyric.goto(base+"/play/",{waitUntil:"domcontentloaded"});
  if(await lyric.locator(".welcome-continue").isVisible())await lyric.locator(".welcome-continue").click();
  await open(lyric);
  assert.equal(await lyric.locator(".theme-choice").count(),15);
  await lyric.locator('.theme-choice[data-theme-id="amethyst"]').click();
  await close(lyric);
  const overflow=await lyric.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,"settings should fit a 390px mobile viewport, overflow="+overflow);
  await lyric.locator('[data-action="lyric-open"]').first().click();
  await lyric.locator('[data-action="lyric-demo"]').click();
  await lyric.locator("#lyric-next-keystroke").waitFor();
  await open(lyric);
  assert.equal(await lyric.locator('.theme-choice[aria-pressed="true"]').getAttribute("data-theme-id"),"amethyst");
  await close(lyric);
  await lyric.locator('[data-action="lyric-back"]').first().click();
  await lyric.locator('[data-action="lyric-home"]').first().click();
  if (await lyric.locator(".welcome-continue").isVisible()) {
    await lyric.locator(".welcome-continue").click();
  }
  await lyric.locator('[data-action="learn"][data-os="linux"]').click();
  await lyric.locator("#lesson-input").waitFor();
  await open(lyric);
  await lyric.locator('.theme-choice[data-theme-id="signal"]').click();
  await close(lyric);
  await lyric.locator("#lesson-input").fill("ls");
  assert.equal(await lyric.locator("#lesson-input").inputValue(),"ls");
  assert.deepEqual(errors,[],"no JavaScript errors");
  await page.close(); await lyric.close();
  console.log("PASS: 15 visual themes, mission isolation, saved preferences, desktop/mobile, and three practice modes.");
}finally{await browser.close();}
