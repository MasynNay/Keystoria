"""Interactive cockpit checks using the real frontend with server-generated state.

The browser's WebSocket is simulated because this test runs without a public
server. Live WebSocket behavior is covered separately by the Python suite.
"""
from __future__ import annotations
import os
from playwright.sync_api import sync_playwright, expect
from browser_v07 import launch_page
from browser_offline import OUT, Clock
from server.game import GameEngine


def start(engine, clock, mission):
    room, player = engine.create('PLAYER','%s' % mission,solo=True)
    engine.start(room,player)
    return room,player


def main():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.getenv('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--no-proxy-server'])
        for width,height in ((1440,900),):
            page,errors=launch_page(browser,width,height)
            page.evaluate('() => {fakeWS.readyState=1;fakeWS.listeners.open()}')
            for mission in ('dead_air','station','hollow','outbreak','casefile','last_stop'):
                clock=Clock();engine=GameEngine(clock)
                room,player=start(engine,clock,mission)
                # Send the actual briefing + countdown + game snapshots.
                page.evaluate('state=>pushSnapshot(state)',engine.view(room,player))
                expect(page.locator('.briefing-page')).to_be_visible()
                engine.ready(room,player)
                assert room.phase=='countdown'
                initial=engine.view(room,player)
                page.evaluate('state=>pushSnapshot(state)',initial)
                expect(page.locator('#deployment-count')).to_have_text('READY')
                assert page.locator('.countdown-assignment').is_visible()
                assert page.locator('.countdown-assignment').text_content().find('Type the highlighted command')>=0
                before=room.remaining
                clock.advance(3.25);engine.tick(room)
                assert room.phase=='countdown' and room.remaining==before
                page.evaluate('state=>pushSnapshot(state)',engine.view(room,player))
                expect(page.locator('#deployment-count')).to_have_text('3')
                clock.advance(2.85);engine.tick(room)
                assert room.phase=='playing' and room.remaining==before
                page.evaluate('state=>pushSnapshot(state)',engine.view(room,player))
                expect(page.locator('#mission-cinema svg')).to_be_visible()
                expect(page.locator('#task-input')).to_be_visible()
                assert page.locator('#task-input').evaluate('el=>document.activeElement===el'),f'input not focused: {mission}'
                assert page.evaluate('scrollY')<=4,f'page scrolled on entry: {mission}'
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),f'horizontal overflow {mission}/{width}'
                assert page.locator('.mission-sidebar').is_visible()
                assert page.locator('.team-sidebar').is_visible()
                assert page.locator('.game-intelligence').is_visible()
                if width>=1100:
                    # The important three things must be visible simultaneously.
                    scene=page.locator('#cinema-art').bounding_box()
                    command=page.locator('#target-text').bounding_box()
                    field=page.locator('#task-input').bounding_box()
                    print(f'{mission}@{width}: scene={scene}, command={command}, input={field}')
                    assert scene['y']<height-80 and command['y']<height-80 and field['y']<height, f'cockpit not in viewport: {mission}@{width}'
                    assert scene['x'] < field['x'] and scene['x']+scene['width']<=field['x']+10,'scene not alongside field'
                if mission=='dead_air':
                    page.screenshot(path=str(OUT/f'dead-air-cockpit-v010-{width}.png'),animations='disabled',full_page=False)
                task=room.hack_target
                page.locator('#task-input').fill(task['text'][:5])
                expect(page.locator('#target-text .correct')).to_have_count(5)
                assert page.evaluate('scrollY')<=4,'typing moved the page'
                # Trigger first step; the illustration must reflect the action.
                page.locator('#task-input').fill('')
                engine.submit(room,player,task['id'],task['text'])
                page.evaluate('state=>pushSnapshot(state)',engine.view(room,player))
                expect(page.locator('#scene-rescue-pct')).to_have_text('9%')
            # Resizing the same live page catches responsive problems without
            # reloading the module graph or establishing another browser app.
            for narrow_width,narrow_height in ((1100,800),(390,844)):
                page.set_viewport_size({'width':narrow_width,'height':narrow_height})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),f'horizontal overflow at {narrow_width}'
                expect(page.locator('#mission-cinema svg')).to_be_visible()
                expect(page.locator('#task-input')).to_be_visible()
                if narrow_width==390:
                    page.screenshot(path=str(OUT/'dead-air-mobile-v010.png'),animations='disabled',full_page=False)
                else:
                    scene=page.locator('#cinema-art').bounding_box()
                    field=page.locator('#task-input').bounding_box()
                    assert scene['x']<field['x'] and field['y']+field['height']<narrow_height-5, f'1100px cockpit clipped: {field}'
            assert not errors,errors
            page.close()
        browser.close()
        print('PASS: six missions, 3 viewport sizes, focused typing and scene visible, preserved telemetry, meaningful preparation, progression')

if __name__=='__main__':main()
