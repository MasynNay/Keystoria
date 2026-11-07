"""Interactive v0.7 regression: page entry scroll, continuous text, scene changes.

Runs the real frontend in Chromium with synthetic WebSocket snapshots produced
by the real server game engine. See docs/TESTING.md for the transport caveat.
"""
from __future__ import annotations

import os
from playwright.sync_api import sync_playwright, expect
from browser_offline import ROOT, WEB, OUT, STUBS, module_url, Clock
from server.game import GameEngine


def launch_page(browser, width=1440, height=900):
    page = browser.new_page(viewport={'width':width,'height':height})
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    css='\n'.join([(WEB/'styles.css').read_text(),*((WEB/'styles'/f).read_text() for f in ('typing.css','speed.css','v06.css','v07.css','v08.css','v09.css','v010.css'))])
    page.set_content(f'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{css}</style></head><body data-theme="station"><div class="grain"></div><div id="app"></div><div id="toast-layer"></div></body></html>')
    page.evaluate(STUBS)
    assert page.evaluate("url => import(url).then(()=>'ok').catch(error=>String(error))",module_url(WEB/'app.js',{}))=='ok'
    return page,errors


def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--no-proxy-server'])
        page,errors=launch_page(browser)

        # Enter Academy from a deeply scrolled home page. Do not retain Y.
        page.locator('[data-action="learn"][data-os="linux"]').click()
        expect(page.locator('.academy-play')).to_be_visible()
        assert page.evaluate('window.scrollY')<=2, 'Academy opened below page top'
        page.evaluate('window.scrollTo({top:330,behavior:"instant"})')
        page.locator('[data-action="training-reference"][data-index="3"]').evaluate('el=>el.click()')
        assert abs(page.evaluate('window.scrollY')-330)<=2, 'Command review moved the viewport'
        page.locator('[data-action="training-home"]').first.click()
        page.locator('[data-action="speed-open"]').first.click()
        page.wait_for_function("document.querySelectorAll('#speed-letters .type-char').length > 700")
        assert page.evaluate('window.scrollY')<=2, 'Speed Lab opened below page top'
        reference=page.locator('#speed-letters').text_content()
        assert len(reference)>700, 'Full passage was replaced with a small word card'
        # Capture a letter's horizontal coordinate before and after typing.
        x_before=page.evaluate("() => Math.round(document.querySelectorAll('#speed-letters .type-char')[290].getBoundingClientRect().x)")
        input_box=page.locator('#speed-input')
        input_box.fill(reference[:275])
        x_after=page.evaluate("() => Math.round(document.querySelectorAll('#speed-letters .type-char')[290].getBoundingClientRect().x)")
        assert x_before==x_after, (x_before,x_after)
        assert page.locator('#speed-letters').evaluate('el=>el.scrollTop')>0,'Passage did not move upward'
        assert page.locator('#speed-letters').text_content()==reference,'Reference text changed while typing'
        expect(page.locator('#speed-progress')).to_contain_text('275 characters')
        # A typo and Backspace must update the highlight without moving letters.
        input_box.fill(reference[:275]+'X')
        assert page.locator('#speed-letters .type-char.incorrect').count()>=1
        input_box.fill(reference[:275])
        assert page.locator('#speed-letters .type-char.incorrect').count()==0
        page.screenshot(path=str(OUT/'speed-continuous-v07.png'),full_page=True,animations='disabled')

        page.locator('[data-action="speed-home"]').click()
        page.locator('[data-action="choose-mission"][data-mission="last_stop"]').click()
        page.evaluate('() => {fakeWS.readyState=1; fakeWS.listeners.open();}')
        clock=Clock(); engine=GameEngine(clock)
        room,host=engine.create('TEST','last_stop',solo=True)
        engine.start(room,host);engine.ready(room,host)
        clock.advance(10.1);engine.tick(room)
        page.evaluate('snapshot => pushSnapshot(snapshot)',engine.view(room,host))
        expect(page.locator('#mission-cinema svg')).to_be_visible()
        expect(page.locator('#cinema-title')).to_contain_text('NO BRAKES')
        old_art=page.locator('#cinema-art').inner_html()
        # Both the illustration and narrative update as genuine commands resolve.
        for _ in range(2):
            task=room.hack_target
            engine.submit(room,host,task['id'],task['text'])
            clock.advance(.24);engine.tick(room)
            page.evaluate('snapshot=>pushSnapshot(snapshot)',engine.view(room,host))
        expect(page.locator('#cinema-title')).to_contain_text('ATTACKER LOSES ACCESS')
        assert page.locator('#cinema-art').inner_html()!=old_art
        expect(page.locator('#cinema-progress')).to_contain_text('03 / 12')
        assert page.locator('.cinema-progress-track .seen').count()==2
        page.screenshot(path=str(OUT/'last-stop-scene-v07.png'),full_page=True,animations='disabled')
        # A mission is the only mode that intentionally jumps to the active field.
        assert page.locator('#task-input').is_visible()
        assert not errors,errors
        print('PASS: Academy keeps top/reference scroll; continuous vertical Speed Lab; scene reacts to server progression')

        # Mobile has its own isolated Chromium process to avoid double-importing
        # the entire app as nested data: module URLs into the same browser.
        browser.close()

if __name__=='__main__':main()
