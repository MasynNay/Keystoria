"""Chromium regression for the Academy and visible terminal outcomes.

The actual frontend renders engine-generated snapshots; only transport is stubbed.
The real ticker/WebSocket delivery is separately checked in Python integration.
"""
from __future__ import annotations

import os

from playwright.sync_api import sync_playwright, expect
from browser_v07 import launch_page
from browser_offline import OUT, Clock
from server.game import GameEngine


def main():
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--no-proxy-server'])
        page, errors=launch_page(browser)

        for os_name in ('linux','windows','macos'):
            page.locator(f'[data-action="learn"][data-os="{os_name}"]').click()
            expect(page.locator('.academy-shuffle-label')).to_contain_text('RANDOMIZED')
            expect(page.locator('#lesson-input')).to_be_visible()
            assert page.locator('.glossary-line').count()==14
            expect(page.locator('.reference-command')).to_be_visible()
            page.locator('[data-action="training-home"]').first.click()

        page.evaluate("() => {fakeWS.readyState = 1; fakeWS.listeners.open();}")
        for mission in ('station','hollow','outbreak','casefile','dead_air','last_stop'):
            clock=Clock(); engine=GameEngine(clock)
            room,host=engine.create('TESTER',mission,solo=True)
            engine.start(room,host);engine.ready(room,host)
            clock.advance(10.1);engine.tick(room)
            page.evaluate('data=>pushSnapshot(data)',engine.view(room,host))
            expect(page.locator('#mission-cinema svg')).to_be_visible()
            expect(page.locator('#scene-live-progress')).to_have_attribute('aria-valuenow','0')
            expect(page.locator('#scene-rescue-pct')).to_contain_text('0%')
            # Complete the entire operation with a simulated human operator
            # and the actual ECHO event loop. No progress shortcuts are used.
            saw_last_objective=False
            for attempt in range(2500):
                if room.phase in ('won','lost'):
                    break
                if room.phase=='playing':
                    if room.tactic_active and room.tactic_choice is None:
                        from server.mechanics import WORLD_RULES
                        engine.choose_tactic(room,host,next(iter(WORLD_RULES[mission]['choices'])))
                    target = room.hack_target if room.role_for(host.id)=='hacker' else room.threat_target
                    if target:
                        engine.submit(room,host,target['id'],target['text'])
                    if room.stage==2 and room.progress==5 and not saw_last_objective:
                        page.evaluate('data=>pushSnapshot(data)',engine.view(room,host))
                        expect(page.locator('#scene-rescue-pct')).to_contain_text('91%')
                        saw_last_objective=True
                clock.advance(.25)
                engine.tick(room)
            assert room.phase=='won', (mission,room.finish_reason)
            assert saw_last_objective, mission
            assert room.progress==6 and room.stage==2
            page.evaluate('() => window.scrollTo({top:1000,behavior:"instant"})')
            before=page.evaluate('window.scrollY')
            assert before>100, f'{mission}: gameplay screen was too short to test prior scroll'
            page.evaluate('data=>pushSnapshot(data)',engine.view(room,host))
            expect(page.locator('.outcome-marquee.success')).to_be_visible()
            expect(page.locator('.result-cinema')).to_be_visible()
            expect(page.locator('.result-cinema-caption')).to_contain_text('100% SECURED')
            expect(page.locator('.result-reason')).to_contain_text('Both operators completed')
            assert page.evaluate('window.scrollY')<=2, f'{mission}: result opened below top of screen'
            if mission=='outbreak':
                page.screenshot(path=str(OUT/'patient-zero-result-v08.png'),full_page=True,animations='disabled')
            if mission=='last_stop':
                page.screenshot(path=str(OUT/'last-stop-result-v08.png'),full_page=True,animations='disabled')

        assert not errors,errors
        print('PASS: three randomized OS academies, six animated-world progress displays, six visible win screens, scroll-to-top')
        browser.close()


if __name__=='__main__':main()
