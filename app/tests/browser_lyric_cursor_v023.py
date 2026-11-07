"""Browser-level regression of Lyric Lab's live next-letter indicator.

The original demo is playable without provider calls; this exercises actual
keyboard input and CSS in Chromium. No third-party services are verified.
"""
from __future__ import annotations
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_v020 import open_app

OUT=Path(__file__).resolve().parents[1]/'docs'/'screenshots'

def run():
    OUT.mkdir(exist_ok=True,parents=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
        page,errors=open_app(browser)
        page.locator('[data-action="lyric-demo"]').click()
        letters=page.locator('#lyric-current-line .lyric-live-word')
        assert 'Signals' in letters.inner_text()
        assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY S'
        current=page.locator('#lyric-current-line .type-char.current')
        assert current.inner_text()=='S'
        assert current.evaluate('(el)=>getComputedStyle(el).animationName')=='lyric-next-letter-flash'
        assert page.locator('#lyric-current-line .lyric-active-word').evaluate('(el)=>getComputedStyle(el).borderBottomWidth')=='3px'
        page.locator('#lyric-toggle').click()
        input=page.locator('#lyric-input')
        input.fill('Sig')
        assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY N'
        assert current.inner_text()=='n'
        assert page.locator('#lyric-current-line .type-char.correct').count()==3
        page.locator('.lyric-stage').screenshot(path=str(OUT/'lyric-next-key-desktop-v023.png'),animations='disabled')
        input.fill('Sx')
        assert page.locator('#lyric-current-line .type-char.incorrect').count()==1
        assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY G'
        assert 'lyric-error' in input.get_attribute('class')
        input.fill('Signals')
        assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY SPACE'
        assert page.locator('#lyric-current-line .type-end-caret').count()==1
        page.locator('.lyric-stage').screenshot(path=str(OUT/'lyric-word-ready-v023.png'),animations='disabled')
        input.press('Space')
        assert page.locator('#lyric-progress').inner_text().startswith('1/')
        assert current.inner_text()=='t'
        assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY T'
        input.press('Enter')
        assert page.locator('#lyric-current-line').inner_text().startswith('Another city')
        assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY A'
        input.fill('An')
        page.locator('[data-action="lyric-retry"]').click()
        assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY S'
        assert input.input_value()==''
        page.locator('[data-action="lyric-strict"]').click()
        assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY S'
        assert not errors,errors

        mobile,mobile_errors=open_app(browser,390,844)
        mobile.locator('[data-action="lyric-demo"]').click()
        assert mobile.locator('#lyric-next-keystroke').is_visible()
        assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        mobile.locator('.lyric-stage').screenshot(path=str(OUT/'lyric-next-key-mobile-v023.png'),animations='disabled')
        assert not mobile_errors,mobile_errors
        browser.close()
    print('PASS: next-letter blinking cursor, accuracy colors, punctuation ready state, space/skip/retry, mobile')

if __name__=='__main__':run()
