"""v0.12 story-only graphics regression with real Chromium DOM rendering.

WebSocket transport is stubbed locally, while every snapshot comes from the
real Python engine. Multiplayer transport is tested in the API suite.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from browser_v07 import launch_page
from browser_offline import WEB, OUT, Clock
from server.game import GameEngine


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True,
            executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),
            args=['--no-sandbox','--no-proxy-server'])
        page, errors = launch_page(browser, 1440, 900)
        page.add_style_tag(content=(WEB/'styles'/'v011.css').read_text())
        page.add_style_tag(content=(WEB/'styles'/'v012.css').read_text())
        page.evaluate('() => {fakeWS.readyState=1;fakeWS.listeners.open()}')
        for mission in ('dead_air','hollow','outbreak','whiteout','ashfall','carnival'):
            clock=Clock(); game=GameEngine(clock)
            room,host=game.create('SCENE',mission,solo=True)
            game.start(room,host);game.ready(room,host)
            clock.advance(10.1);game.tick(room)
            page.evaluate('room=>pushSnapshot({...room,phase:"lobby"})',game.view(room,host))
            page.evaluate('room=>pushSnapshot(room)',game.view(room,host))
            expect(page.locator('.story-depth')).to_have_count(1)
            expect(page.locator('.cinematic-closeup')).to_have_count(1)
            expect(page.locator('#task-input')).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),mission
            assert page.locator('#task-input').evaluate('(el)=>document.activeElement===el'),mission
            scene=page.locator('.cinema-art').bounding_box()
            field=page.locator('#task-input').bounding_box()
            assert scene['x']<field['x'],mission
            assert field['y']+field['height']<=900,mission
            if mission in ('dead_air','whiteout','ashfall','carnival'):
                page.screenshot(path=str(OUT / f'{mission}-story-v012.png'),animations='disabled',full_page=False)
            target=room.hack_target
            field_input=page.locator('#task-input')
            field_input.fill(target['text'][:max(1,len(target['text'])//2)])
            assert float(page.locator('#shot-completion-fill').get_attribute('width'))>0,mission
            field_input.fill('')
            game.submit(room,host,target['id'],target['text'])
            clock.advance(.25);game.tick(room)
            page.evaluate('state=>pushSnapshot(state)',game.view(room,host))
            assert page.locator('.cinematic-closeup').get_attribute('data-focus') is not None
        assert not errors,errors
        browser.close()
        print('PASS: story-only v0.12 graphics, typing, scene progress, six representative missions, desktop')

if __name__=='__main__':main()
