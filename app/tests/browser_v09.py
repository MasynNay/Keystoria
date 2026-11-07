"""Real Chromium interface checks for v0.9 with authoritative engine snapshots.

WebSocket transport is stubbed because local browser navigation is blocked in
this environment. HTTP/WebSocket integration runs separately in Python tests.
"""
from __future__ import annotations

import os
from playwright.sync_api import sync_playwright, expect
from browser_v07 import launch_page
from browser_offline import OUT, Clock
from server.game import GameEngine


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True, executable_path=os.getenv('CHROMIUM_PATH', '/usr/bin/chromium'),
            args=['--no-sandbox', '--no-proxy-server'],
        )
        for width in (1440,):
            page, errors = launch_page(browser, width=width, height=900)
            page.locator('[data-action="learn"][data-os="macos"]').click()
            expect(page.locator('[data-action="training-shuffle"]')).to_be_visible()
            assert page.evaluate('window.scrollY') <= 2
            page.locator('[data-action="training-shuffle"]').click()
            expect(page.locator('#lesson-input')).to_be_visible()
            page.locator('[data-action="training-home"]').first.click()
            page.evaluate('() => {fakeWS.readyState = 1; fakeWS.listeners.open();}')

            for mission in ('station','hollow','outbreak','casefile','dead_air','last_stop'):
                clock=Clock();engine=GameEngine(clock)
                room,host=engine.create('RAVEN', mission, solo=True)
                engine.start(room,host);engine.ready(room,host)
                clock.advance(10.1);engine.tick(room)
                # Change through a lobby first to force a fresh mission view.
                page.evaluate('data=>pushSnapshot(data)',{**engine.view(room,host), 'phase':'lobby'})
                page.evaluate('data=>pushSnapshot(data)',engine.view(room,host))
                assert page.locator('#field-jump').is_disabled()
                task=room.hack_target
                engine.submit(room,host,task['id'],task['text'])
                page.evaluate('data=>pushSnapshot(data)',engine.view(room,host))
                expect(page.locator('#field-jump')).to_be_enabled()
                expect(page.locator('#scene-env-value')).to_contain_text('/ 100')
                expect(page.locator('#field-content .field-choice-grid button')).to_have_count(2)
                # The in-scene action is a real click; client sends an action ID.
                page.locator('#field-jump').click(timeout=5000)
                button=page.locator('.field-choice-grid button').first
                chosen=button.get_attribute('data-field')
                button.click(timeout=5000)
                emitted=page.evaluate('window.sentMessages.filter(item => item.type === "field_action").at(-1)')
                assert emitted['action']==chosen, (mission,emitted)
                engine.operate_field(room,host,chosen)
                page.evaluate('data=>pushSnapshot(data)',engine.view(room,host))
                expect(page.locator('.field-done')).to_be_visible()
                expect(page.locator('#field-jump')).to_be_disabled()
                expect(page.locator('#field-story-log')).to_contain_text('ACT 1')
                assert page.locator('#cinema-art svg .scene-intervention').count()==1
                if mission=='last_stop' and width==1440:
                    page.screenshot(path=str(OUT/'last-stop-interactive-v09.png'),full_page=True,animations='disabled')
                if mission=='outbreak' and width==1440:
                    page.screenshot(path=str(OUT/'patient-zero-controls-v09.png'),full_page=True,animations='disabled')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),(mission,width,'horizontal overflow')
            # Repeat responsive validation without creating another nested
            # data-module browser instance (which is expensive in Chromium).
            page.set_viewport_size({'width':390,'height':860})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'mobile horizontal overflow'
            expect(page.locator('.field-done')).to_be_visible()
            page.screenshot(path=str(OUT/'last-stop-mobile-v09.png'),full_page=True,animations='disabled')
            assert not errors,errors
            page.close()
        browser.close()
        print('PASS: 6 missions desktop + last-stop mobile; clickable world actions, visible outcomes, no overflow; Academy reshuffle')


if __name__=='__main__':main()
