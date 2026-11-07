"""Focused 390px rendering check of the real Speed Lab flow component."""
from __future__ import annotations
import os
from playwright.sync_api import sync_playwright
from browser_offline import WEB, OUT, module_url

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--no-proxy-server'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    css='\n'.join([(WEB/'styles.css').read_text(),*((WEB/'styles'/p).read_text() for p in ('typing.css','speed.css','v06.css','v07.css'))])
    page.set_content(f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style></head><body data-theme="station"><main class="speed-page shell"><div class="speed-console"><div class="speed-prompt-wrap"><div class="speed-prompt-label">LIVE CHARACTER FEEDBACK</div><div id="speed-letters" class="typing-feedback speed-letters"></div><div class="speed-page-indicator">CONTINUOUS PASSAGE</div></div><textarea id="speed-input" class="speed-input"></textarea></div></main></body></html>''')
    reference=('alpha beta gamma delta epsilon zeta theta omega ' * 50).strip()
    url=module_url(WEB/'ui'/'speed-flow.js',{})
    page.evaluate('''async args => {
      const mod=await import(args.url);
      const flow=mod.createSpeedFlow(document.getElementById('speed-letters'),args.reference);
      document.getElementById('speed-input').addEventListener('input',event=>flow.update(event.target.value));
    }''',{'url':url,'reference':reference})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.locator('#speed-input').fill(reference[:205])
    assert page.locator('#speed-letters').evaluate('el=>el.scrollTop')>0
    assert not errors,errors
    page.screenshot(path=str(OUT/'speed-mobile-v07.png'),full_page=True,animations='disabled')
    print('PASS: 390px, continuous upward passage movement, no horizontal overflow')
    browser.close()
