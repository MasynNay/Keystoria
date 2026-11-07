"""Nine-world cinematic and typing-focus browser smoke test.

Uses the real frontend with authoritative Python snapshots. Browser network is
stubbed, while separate API tests exercise actual WebSocket delivery.
"""
from __future__ import annotations

import os
from playwright.sync_api import sync_playwright, expect
from browser_v07 import launch_page
from browser_offline import WEB, OUT, Clock
from server.game import GameEngine
from server.content import MISSIONS


def main():
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,
            executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),
            args=['--no-sandbox','--no-proxy-server'])
        page,errors=launch_page(browser,1440,900)
        page.add_style_tag(content=(WEB/'styles'/'v011.css').read_text())
        page.evaluate('() => {fakeWS.readyState=1;fakeWS.listeners.open()}')
        for mission in MISSIONS:
            clock=Clock();game=GameEngine(clock)
            room,host=game.create('ALPHA',mission,solo=True)
            game.start(room,host);game.ready(room,host)
            clock.advance(10.1);game.tick(room)
            snapshot=game.view(room,host)
            page.evaluate('room => pushSnapshot({...room,phase:"lobby"})',snapshot)
            page.evaluate('room => pushSnapshot(room)',snapshot)
            expect(page.locator('.cinematic-closeup')).to_have_count(1)
            expect(page.locator('#cinema-dialogue')).to_be_visible()
            expect(page.locator('#task-input')).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),mission
            # Progress advances as characters are typed, but completion is still
            # controlled by the server and only confirmed responses cut frames.
            task=room.hack_target
            half=task['text'][:len(task['text'])//2]
            page.locator('#task-input').fill(half)
            fill_width=float(page.locator('#shot-completion-fill').get_attribute('width'))
            assert fill_width>20,(mission,fill_width)
            first_focus=page.locator('.cinematic-closeup').get_attribute('data-focus')
            first_line=page.locator('#cinema-dialogue').inner_text()
            page.locator('#task-input').fill('')
            game.submit(room,host,task['id'],task['text'])
            page.evaluate('room => pushSnapshot(room)',game.view(room,host))
            expect(page.locator('#cinema-progress')).to_contain_text('02 / 12')
            next_line=page.locator('#cinema-dialogue').inner_text()
            assert first_line!=next_line,(mission,'dialogue did not advance')
            assert page.locator('#cinema-action-status').inner_text().endswith('0%')
            assert page.locator('#shot-completion-fill').get_attribute('width') == '0'
            # Keep the entire input field and scene in the initial viewport.
            scene=page.locator('#cinema-art').bounding_box()
            field=page.locator('#task-input').bounding_box()
            assert scene['y']<850 and field['y']+field['height']<900,(mission,scene,field)
            if mission in ('dead_air','abyss','neon','red_horizon'):
                page.screenshot(path=str(OUT/f'{mission}-cinema-v011.png'),full_page=False,animations='disabled')
            print(mission, first_focus, '->',page.locator('.cinematic-closeup').get_attribute('data-focus'))
        # The outcome must expose a working twelve-frame replay, and changing
        # slides must not mutate the server's completed result.
        game._finish(room,True)
        page.evaluate('snapshot => pushSnapshot(snapshot)',game.view(room,host))
        expect(page.locator('.story-reel')).to_be_visible()
        expect(page.locator('#reel-counter')).to_have_text('01 / 12')
        expect(page.locator('#reel-prev')).to_be_disabled()
        page.locator('#reel-next').click()
        expect(page.locator('#reel-counter')).to_have_text('02 / 12')
        assert page.locator('#reel-narrative').inner_text()
        page.locator('#reel-prev').click()
        expect(page.locator('#reel-counter')).to_have_text('01 / 12')
        for index in range(11):
            page.locator('#reel-next').click()
        expect(page.locator('#reel-counter')).to_have_text('12 / 12')
        expect(page.locator('#reel-next')).to_be_disabled()
        expect(page.locator('.outcome-marquee.success')).to_be_visible()
        assert game.view(room,host)['phase']=='won'
        print('PASS: 12-frame after-action story reel, previous/next/end bounds')
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),'mobile overflow'
        assert not errors,errors
        browser.close()
        print('PASS: 9 cinematic missions, live typing props, transitions, viewport and mobile overflow')


if __name__=='__main__':main()
