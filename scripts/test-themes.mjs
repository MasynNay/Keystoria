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

/** Contrast of actual computed text and painted control backgrounds, not
 * merely palette tokens. Samples flat opaque surfaces; see accessibility QA
 * for gradients, overlays and physical-screen limitations.
 */
async function assertRenderedSettingsContrast(page,themeId){
 const results=await page.evaluate((id)=>{
  const samples=[
   ['theme choice', '.theme-choice[data-theme-id="'+id+'"] .theme-choice-name', '.theme-choice[data-theme-id="'+id+'"]'],
   ['selection status','#theme-selection-status','.settings-modal'],
   ['setting title','.settings-list .setting-choice strong','.settings-list .setting-choice'],
   ['setting help','.settings-list .setting-choice small','.settings-list .setting-choice'],
   ['Done action','.settings-modal > button.btn-primary','.settings-modal > button.btn-primary']
  ];
  const luminance=(css)=>{
   const channels=(css.match(/[0-9.]+/g)||[]).slice(0,3).map(Number);
   if(channels.length!==3)throw new Error('Cannot parse computed color: '+css);
   const [r,g,b]=channels.map(c=>{const n=c/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});
   return r*.2126+g*.7152+b*.0722;
  };
  return samples.map(([label,foregroundSelector,backgroundSelector])=>{
   const foreground=document.querySelector(foregroundSelector);
   const background=document.querySelector(backgroundSelector);
   if(!foreground||!background)throw new Error('Missing rendered contrast fixture: '+label);
   const fg=getComputedStyle(foreground).color;
   const bg=getComputedStyle(background).backgroundColor;
   const a=luminance(fg),b=luminance(bg);
   return {label,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),fg,bg};
  });
 },themeId);
 for(const {label,ratio,fg,bg} of results)
  assert.ok(ratio>=4.5,themeId+' '+label+' contrast '+ratio.toFixed(2)+':1 (text '+fg+' on '+bg+')');
}

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
    await assertRenderedSettingsContrast(page,theme.id);
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

  // Real computed mobile typing surfaces must follow every user palette,
  // instead of retaining navy/purple hard-coded colors from the original UI.
  const mobileThemes=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:"reduce"});
  mobileThemes.on("pageerror",err=>errors.push(String(err)));
  await mobileThemes.goto(base+"/play/",{waitUntil:"domcontentloaded"});
  if(await mobileThemes.locator(".welcome-continue").isVisible())await mobileThemes.locator(".welcome-continue").click();
  await mobileThemes.locator('[data-action="speed-open"]').first().click();
  await mobileThemes.locator("#speed-input").focus();
  await open(mobileThemes);
  for(const theme of themes){
    await mobileThemes.locator('.theme-choice[data-theme-id="'+theme.id+'"]').click();
    const result=await mobileThemes.evaluate(()=>{
      const css=el=>getComputedStyle(document.querySelector(el));
      const body=getComputedStyle(document.body);
      const isVisible=el=>el.getBoundingClientRect().height>0;
      const rgb=s=>{const match=s.match(/[0-9.]+/g);return match?.slice(0,3).map(Number).join(',');};
      const panel=body.getPropertyValue('--theme-panel-2').trim();
      const surface=css('.mobile-speed-cue');
      const action=css('.speed-mobile-entry .mobile-entry-actions button:last-child');
      return {
        visible:isVisible(document.querySelector('.mobile-speed-cue')),
        panel:rgb(panel),surface:rgb(surface.backgroundColor),
        text:rgb(body.getPropertyValue('--theme-text')),actualText:rgb(surface.color),
        actionBackground:rgb(action.backgroundColor),expectedAction:rgb(body.getPropertyValue('--theme-panel')),
        actionText:rgb(action.color),accent:rgb(body.getPropertyValue('--theme-accent'))
      };
    });
    assert.equal(result.visible,true,'phone cue visible for '+theme.id);
    assert.equal(result.surface,result.panel,'mobile cue uses selected theme panel for '+theme.id);
    assert.equal(result.actualText,result.text,'mobile cue uses selected theme foreground for '+theme.id);
    assert.equal(result.actionBackground,result.expectedAction,'secondary touch action uses selected theme panel for '+theme.id);
    assert.equal(result.actionText,result.text,'secondary touch action uses selected theme foreground for '+theme.id);
  }
  await close(mobileThemes);
  await mobileThemes.close();
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
