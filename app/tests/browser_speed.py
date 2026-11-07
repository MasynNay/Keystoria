"""Real Chromium interaction checks for the Speed Lab and unified typing feedback.

The browser imports the production modules. Only the multiplayer transport is
stubbed; the local Speed Lab is not mocked. No external network is required.
"""
from __future__ import annotations

import os

from playwright.sync_api import sync_playwright, expect
from browser_offline import ROOT, WEB, OUT, module_url, STUBS, Clock
from server.game import GameEngine


def main():
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(
            executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),
            args=['--no-sandbox','--no-proxy-server'],headless=True)
        page=browser.new_page(viewport={'width':1440,'height':900})
        page.clock.install()
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        css = "\n".join(["\n".join((WEB / "styles.css").read_text().splitlines()[1:]),
                         (WEB / "styles" / "typing.css").read_text(),
                         (WEB / "styles" / "speed.css").read_text()])
        page.set_content(f'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
                         f'<style>{css}</style></head><body data-theme="station">'
                         '<div id="app"></div><div id="toast-layer"></div></body></html>')
        page.evaluate(STUBS)
        modules={}
        loaded=page.evaluate('url => import(url).then(() => "ok").catch(error => String(error))',
                             module_url(WEB/'app.js',modules))
        assert loaded == 'ok',loaded
        expect(page.locator('#speed-lab')).to_be_visible()
        page.screenshot(path=str(OUT/'home-v05.png'),full_page=True,animations='disabled')
        page.locator('[data-action="speed-open"]').first.click()
        expect(page.locator('#speed-input')).to_be_visible()
        assert page.locator('#speed-time').inner_text() == '30'
        assert page.locator('#speed-letters .type-char.current').count() == 1
        page.locator('[data-action="speed-duration"][data-seconds="60"]').click()
        page.locator('[data-action="speed-pack"][data-pack="technology"]').click()
        assert page.locator('#speed-time').inner_text() == '60'
        assert page.locator('[data-action="speed-pack"][data-pack="technology"]').get_attribute('aria-pressed')=='true'
        first=page.locator('#speed-letters').text_content()[:3]
        typed=first[0]+'!'  # Known error: the test never depends on random word contents.
        if first[1]=='!': typed=first[0]+'~'
        page.locator('#speed-input').fill(typed)
        expect(page.locator('#speed-mode')).to_contain_text('LIVE')
        assert page.locator('#speed-letters .type-char.correct').count()==1
        assert page.locator('#speed-letters .type-char.incorrect').count()==1
        assert page.locator('#speed-accuracy').inner_text()=='50%'
        page.screenshot(path=str(OUT/'speed-lab-active-v05.png'),full_page=True,animations='disabled')
        page.locator('#speed-input').press('Backspace')
        assert page.locator('#speed-letters .type-char.incorrect').count()==0
        page.locator('#speed-input').type(first[1:])
        assert page.locator('#speed-letters .type-char.correct').count()>=3
        # Playwright's deterministic clock verifies countdown and finishing
        # without waiting a full minute of real time.
        page.clock.fast_forward(60_100)
        expect(page.locator('.speed-results')).to_be_visible()
        assert page.locator('#speed-time').inner_text() == '0'
        assert page.locator('#speed-wpm').inner_text() == '1'
        expect(page.locator('.speed-result-hero')).to_contain_text('WPM')
        expect(page.locator('.speed-history > div')).to_have_count(1)
        page.screenshot(path=str(OUT/'speed-lab-v05.png'),full_page=True,animations='disabled')
        page.locator('[data-action="speed-restart"]').first.click()
        expect(page.locator('#speed-letters')).to_be_visible()
        assert page.locator('#speed-time').inner_text()=='60'
        page.locator('[data-action="speed-home"]').click()
        expect(page.locator('.mission-card')).to_have_count(6)
        print('PASS: timed Speed Lab, error coloring, backspace, countdown, results, records, restart')

        page.locator('[data-action="learn"][data-os="windows"]').click()
        expect(page.locator('#lesson-input')).to_be_visible()
        page.locator('#lesson-input').fill('Get-Location!')
        assert page.locator('#lesson-target-text .type-char.correct').count()==12
        assert page.locator('#lesson-target-text .type-char.extra').count()==1
        page.locator('#lesson-input').press('Backspace')
        assert page.locator('#lesson-target-text .type-char.extra').count()==0
        page.locator('#lesson-input').press('Enter')
        expect(page.locator('.training-feedback')).to_contain_text('COMMAND RECOGNIZED')
        page.screenshot(path=str(OUT/'academy-feedback-v05.png'),full_page=True,animations='disabled')
        page.locator('[data-action="training-home"]').first.click()
        print('PASS: Academy shares live per-key feedback and preserves completion')

        # Real game-engine snapshots verify that the story's active phrase is
        # accompanied by its authored description, and gameplay scrolls into view.
        page.evaluate('() => { fakeWS.readyState=1; fakeWS.listeners.open(); }')
        clock=Clock()
        engine=GameEngine(clock)
        room,host=engine.create('Pilot','station',solo=True)
        engine.start(room,host)
        engine.ready(room,host)
        clock.advance(10.1)
        engine.tick(room)
        page.evaluate('room => pushSnapshot(room)',engine.view(room,host))
        expect(page.locator('#task-input')).to_be_visible()
        expect(page.locator('#step-explanation')).to_contain_text('maintenance console')
        expect(page.locator('#task-input')).to_be_focused()
        page.wait_for_timeout(120)
        position=page.evaluate('''() => {
          const rect=document.getElementById('task-input').getBoundingClientRect();
          return {top:rect.top,bottom:rect.bottom,viewport:innerHeight};
        }''')
        assert position['top']>=0 and position['bottom']<=position['viewport'],position
        page.locator('#task-input').fill('ovx')
        assert page.locator('#target-text .type-char.correct').count()==2
        assert page.locator('#target-text .type-char.incorrect').count()==1
        assert page.locator('#live-typing-accuracy').inner_text()=='67% ACCURATE'
        page.locator('#task-input').fill('override')
        assert page.locator('#target-text .type-char.incorrect').count()==0
        page.screenshot(path=str(OUT/'mission-feedback-v05.png'),full_page=True,animations='disabled')
        # The precise docking-clamp text is delivered for the authored second act.
        room.stage=2
        room.progress=2
        engine._new_hack(room)
        bot=next(member for member in room.players if member.is_bot)
        page.evaluate('room => pushSnapshot(room)',engine.view(room,bot))
        expect(page.locator('#step-explanation')).to_contain_text('mechanical arms')
        expect(page.locator('#step-explanation')).to_contain_text('cannot launch')
        assert not errors,errors
        print('PASS: mission explanations, character feedback, focus and docking clamps')

        mobile=browser.new_page(viewport={'width':390,'height':844})
        mobile.set_content(f'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
                           f'<style>{css}</style></head><body data-theme="station">'
                           '<div id="app"></div><div id="toast-layer"></div></body></html>')
        mobile.evaluate(STUBS)
        loaded=mobile.evaluate('url => import(url).then(() => "ok").catch(error => String(error))',
                              module_url(WEB/'app.js',modules))
        assert loaded == 'ok',loaded
        mobile.locator('[data-action="speed-open"]').first.click()
        mobile.locator('#speed-input').fill('wrong')
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Mobile speed layout overflow'
        mobile.screenshot(path=str(OUT/'mobile-speed-lab-v05.png'),full_page=True,animations='disabled')
        print('PASS: 390px mobile Speed Lab layout')
        browser.close()
    print('PASS: Speed Lab + feedback Chromium smoke test without JS exceptions')

if __name__=='__main__':
    main()
