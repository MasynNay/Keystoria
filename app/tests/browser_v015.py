"""Offline Chromium checks for the v0.15 in-story graphics and homepage.

All mission snapshots originate from the real server state machine. Browser
network and human multiplayer are tested separately, not simulated as real.
"""
from __future__ import annotations
import json
import os
import runpy
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'docs'/'screenshots'


def main():
    snapshots=runpy.run_path(str(ROOT/'tests'/'browser_v013.py'))['snapshots']()
    chosen={key:value for key,value in snapshots.items() if key in {
       'station','hollow','outbreak','casefile','dead_air','last_stop','abyss',
       'neon','red_horizon','whiteout','ashfall','carnival'}}
    assert len(chosen)==12
    with tempfile.TemporaryDirectory(prefix='pp-v015-') as tmp:
        path=Path(tmp)
        (path/'snapshots.json').write_text(json.dumps(chosen))
        subprocess.run(['node',str(ROOT/'tests'/'render_v015_fixtures.mjs')],cwd=ROOT,
            env={**os.environ,'PANIC_V015_PREVIEW':str(path)},check=True,timeout=25)
        OUTPUT.mkdir(parents=True,exist_ok=True)
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
            desktop=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
            desktop.set_content((path/'home.html').read_text(),wait_until='domcontentloaded',timeout=15000)
            actions=desktop.locator('.hero-actions [data-action]').evaluate_all('(elements)=>elements.map(e=>e.dataset.action)')
            assert actions==['solo','create'],actions
            desktop.set_content((path/'welcome.html').read_text(),wait_until='domcontentloaded',timeout=15000)
            assert desktop.locator('.welcome-modal').is_visible()
            assert desktop.locator('.welcome-ways article').count()==3
            desktop.screenshot(path=str(OUTPUT/'welcome-v015.png'),animations='disabled')
            for mission in chosen:
                desktop.set_content((path/f'{mission}.html').read_text(),wait_until='domcontentloaded',timeout=15000)
                assert desktop.locator('.action-stage').count()==1,mission
                assert desktop.locator('.action-stage').get_attribute('data-action-world')==mission
                assert desktop.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),mission
                scene=desktop.locator('#cinema-art').bounding_box()
                field=desktop.locator('#task-input').bounding_box()
                assert scene['x']<field['x'] and field['y']+field['height']<=900,(mission,scene,field)
                if mission in ('dead_air','abyss','carnival','last_stop'):
                    desktop.locator('#cinema-art').evaluate("el => el.style.setProperty('--typing-progress','0.65')")
                    desktop.screenshot(path=str(OUTPUT/f'{mission}-action-v015.png'),animations='disabled')
                # Progress modifies SVG actuator without moving the typing field.
                element=desktop.locator('.action-stage .act-signal-fill')
                initial=element.evaluate('el=>getComputedStyle(el).transform')
                desktop.locator('#cinema-art').evaluate("el=>el.style.setProperty('--typing-progress','1')")
                desktop.wait_for_timeout(220)
                final=element.evaluate('el=>getComputedStyle(el).transform')
                assert initial!=final,(mission,initial,final)
            mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
            mobile.set_content((path/'welcome.html').read_text(),wait_until='domcontentloaded',timeout=15000)
            assert mobile.locator('.welcome-modal').is_visible()
            assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            mobile.screenshot(path=str(OUTPUT/'welcome-mobile-v015.png'),animations='disabled')
            mobile.set_content((path/'dead_air.html').read_text(),wait_until='domcontentloaded',timeout=15000)
            assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            mobile.screenshot(path=str(OUTPUT/'dead-air-mobile-v015.png'),animations='disabled')
            browser.close()
    print('PASS: homepage, twelve story stages, typing-actuator motion, desktop/mobile layout')


if __name__=='__main__':main()
