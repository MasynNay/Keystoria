"""Verify static portfolio HTML/CSS/images without network navigation (blocked in runner)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re,base64,os

ROOT=Path(__file__).resolve().parents[1]
PAGE=ROOT/'portfolio'
OUT=ROOT/'docs/screenshots'

def inline_resources():
    text=(PAGE/'index.html').read_text()
    text=text.replace('<link rel="stylesheet" href="styles.css">',f'<style>{(PAGE/"styles.css").read_text()}</style>')
    def image_link(match):
        name=match.group(1)
        raw=(PAGE/name).read_bytes()
        mime='image/svg+xml' if name.endswith('.svg') else 'image/png'
        return 'src="data:'+mime+';base64,'+base64.b64encode(raw).decode()+'"'
    text=re.sub(r'src="(assets/[^"]+)"',image_link,text)
    return text

def run():
    OUT.mkdir(parents=True,exist_ok=True)
    html=inline_resources()
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--no-proxy-server','--disable-dev-shm-usage'])
        for width,height in [(1440,900),(390,844)]:
            page=browser.new_page(viewport={'width':width,'height':height})
            errors=[]
            page.on('pageerror',lambda err:errors.append(str(err)))
            page.set_content(html,wait_until='domcontentloaded')
            page.locator('img').evaluate_all('(els)=>els.forEach(i=>i.loading="eager")')
            page.wait_for_function('Array.from(document.images).every(i=>i.complete)',timeout=8000)
            assert page.title().startswith('Keystoria')
            assert page.locator('.mode').count()==4
            assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'),f'overflow {width}'
            assert not page.locator('img').evaluate_all('(els)=>els.filter(i=>!i.complete || !i.naturalWidth).map(i=>i.src)')
            page.screenshot(path=str(OUT/f'keystoria-portfolio-{width}-v024.png'),animations='disabled')
            assert not errors,errors
            page.close()
        browser.close()
    print('PASS: static portfolio desktop/mobile, all images, no overflow, no console errors')

if __name__=='__main__':run()
