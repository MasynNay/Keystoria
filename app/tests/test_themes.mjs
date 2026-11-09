import assert from "node:assert/strict";
import test from "node:test";
import { THEMES, THEME_IDS, DEFAULT_THEME, validTheme } from "../web/ui/themes.js";
import { loadPreferences, savePreferences, applyPreferences } from "../web/ui/preferences.js";

function storage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_, item) => { value = item; },
    read: () => value,
  };
}

test("fifteen named themes have unique IDs and readable contrast", () => {
  assert.equal(THEMES.length, 15);
  assert.equal(new Set(THEME_IDS).size, 15);
  assert.equal(new Set(THEMES.map(x => x.accent)).size, 15);
  for (const theme of THEMES) {
    assert.match(theme.id, /^[a-z][a-z-]*$/);
    assert.ok(theme.name.length > 2);
    for (const key of ["bg","panel","panel2","accent","text","muted","line"]) {
      assert.match(theme[key], /^#[0-9a-f]{6}$/i);
    }
  }
});
test("migrates existing three-toggle settings to Signal without dropping toggles", () => {
  const saved = storage(JSON.stringify({largerType:true,highContrast:false,reducedMotion:true}));
  assert.deepEqual(loadPreferences(saved), {largerType:true,highContrast:false,reducedMotion:true,theme:DEFAULT_THEME});
});
test("theme preferences persist, reject invalid names, and keep accessibility options", () => {
  const stored = storage();
  const settings = savePreferences({largerType:true,highContrast:true,reducedMotion:true,theme:"aurora"},stored);
  assert.equal(settings.theme,"aurora");
  assert.deepEqual(loadPreferences(stored), settings);
  assert.equal(validTheme("not-a-theme"),DEFAULT_THEME);
  assert.equal(loadPreferences(storage(JSON.stringify({theme:"<script>"}))).theme, DEFAULT_THEME);
  const tokens = {};
  const body = {dataset:{},classList:{toggle(key,value){tokens[key]=value;}}};
  applyPreferences(settings,body);
  assert.equal(body.dataset.uiTheme,"aurora");
  assert.equal(tokens["high-contrast"],true);
  assert.equal(tokens["reduce-motion"],true);
  assert.equal(tokens["larger-type"],true);
});
