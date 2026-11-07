"""Live Keystoria brand smoke test and promotional screenshot generation."""
from pathlib import Path
import os, base64
from playwright.sync_api import sync_playwright
from browser_v019 import open_app as open_offline

ROOT = Path(__file__).resolve().parents[1]
WEB=ROOT/"web"

def run():
    out=ROOT/'docs'/'screenshots'
    out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
        for width,height,name in [(1440,940,'keystoria-home-desktop-v024.png'),(390,844,'keystoria-home-mobile-v024.png')]:
            page,errors=open_offline(browser,width,height)
            page.add_style_tag(content=(WEB/'styles'/'v020.css').read_text()+(WEB/'styles'/'v022.css').read_text()+(WEB/'styles'/'brand.css').read_text())
            page.locator('.welcome-continue').click()
            page.locator('.brand-name').wait_for()
            assert 'KEYSTORIA' in page.locator('.brand-name').inner_text().replace('\n','')
            assert 'EVERY KEY' in page.locator('#hero-title').inner_text()
            assert page.locator('.brand-symbol img').get_attribute('src')=='/assets/keystoria-mark.svg'
            assert 'Keystoria — Every Key Opens a World' in (WEB/'index.html').read_text()
            icon='data:image/svg+xml;base64,' + base64.b64encode((WEB/'keystoria-mark.svg').read_bytes()).decode()
            page.locator('.brand-symbol img').evaluate('(el,src)=>el.src=src', icon)
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2'), f'Horizontal overflow width={width}'
            page.screenshot(path=str(out/name), full_page=False,animations='disabled')
            if width==1440:
                page.locator('[data-action="lyric-open"]').first.click()
                assert 'KEYSTORIA' in page.locator('.lyric-kicker').inner_text()
                page.locator('[data-action="lyric-demo"]').click()
                assert page.locator('#lyric-next-keystroke').inner_text()=='NEXT KEY S'
                page.locator('[data-action="lyric-back"]').click()
                page.locator('[data-action="lyric-home"]').click()
            assert not errors,errors
            page.close()
        browser.close()
    print('PASS: Keystoria branding + responsive desktop/mobile + lyric cursor')

if __name__=='__main__':run()
