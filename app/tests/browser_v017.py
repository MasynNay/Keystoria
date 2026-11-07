"""Bounded Chromium visual verification of the actual application templates.

Engine snapshots are real, not mocked; mid-story frame fixtures show a projected
server state for graphical layout checks and are not live human playthroughs.
WebSocket integration and completion are tested separately in Python tests.
"""
from __future__ import annotations
import json, os, runpy, subprocess, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from server.content import MISSIONS
from server.objectives import STORY_PATHS

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs'/'screenshots'


def main():
    all_states=runpy.run_path(str(ROOT/'tests'/'browser_v013.py'))['snapshots']()
    chosen={key:value for key,value in all_states.items() if key in MISSIONS}
    assert len(chosen)==24
    # Project future states for graphics only; pass known real objective text.
    for step in (4,5,8,10):
        room=dict(chosen['mirrorfall'])
        room['stage']=1 if step<5 else 2
        room['progress']=step if step<5 else step-5
        room['target']=dict(room.get('target') or {})
        room['target']['id']=f'fixture:mirrorfall:{step}'
        room['target']['text']=(STORY_PATHS['mirrorfall'][0]+STORY_PATHS['mirrorfall'][1])[step]
        room['target']['explanation']='The rescue crew is crossing the mirrored district; the world changes as the gate opens.'
        chosen[f'mirrorfall_step_{step}']=room
    with tempfile.TemporaryDirectory(prefix='pp-v017-') as name:
        folder=Path(name)
        (folder/'snapshots.json').write_text(json.dumps(chosen))
        subprocess.run(['node',str(ROOT/'tests/render_v017_fixtures.mjs')],cwd=ROOT,env={**os.environ,'PANIC_V017_PREVIEW':str(folder)},check=True,timeout=30)
        OUT.mkdir(parents=True,exist_ok=True)
        with sync_playwright() as play:
            browser=play.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
            desktop=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
            def open_fixture(page,name):
                page.set_content((folder/name).read_text(),wait_until='domcontentloaded',timeout=16000)
                page.evaluate('window.scrollTo(0,0)')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),name
            open_fixture(desktop,'home.html')
            marks=desktop.locator('.mission-card .mission-cover-mark svg.mission-mark').evaluate_all('(elements)=>elements.map(x=>x.dataset.missionMark)')
            assert len(marks)==24 and len(set(marks))==24,marks
            desktop.locator('.operations').screenshot(path=str(OUT/'eighteen-mission-icons-v017.png'),animations='disabled')
            for mission in MISSIONS:
                open_fixture(desktop,f'{mission}.html')
                assert desktop.locator('.action-stage').count()==1,mission
                assert desktop.locator('.cinematic-closeup').count()==1,mission
                assert desktop.locator('#cinema-impact').count()==0,mission
                art=desktop.locator('#cinema-art').bounding_box()
                field=desktop.locator('#task-input').bounding_box()
                assert art and field and art['x']<field['x'] and field['y']+field['height']<=901,(mission,art,field)
                if mission in ('mirrorfall','four_winds','dawnforge','glass_trials','wildbond','stardoor'):
                    desktop.locator('#cinema-art').evaluate("el=>el.style.setProperty('--typing-progress','0.65')")
                    desktop.screenshot(path=str(OUT/f'{mission}-story-v017.png'),animations='disabled')
            for step in (4,5,8,10):
                open_fixture(desktop,f'mirrorfall_step_{step}.html')
                element=desktop.locator('.legend-mirror-world')
                assert element.count()==1
                assert element.get_attribute('data-mirror-step')==str(step)
                desktop.wait_for_timeout(1200)
                transform=element.evaluate('el=>getComputedStyle(el).transform')
                if step in (5,8):
                    assert 'matrix(-1' in transform or 'matrix(-0.999' in transform,(step,transform)
                if step in (4,10):
                    assert transform=='none' or 'matrix(1' in transform,(step,transform)
                desktop.locator('#cinema-art').screenshot(path=str(OUT/f'mirrorfall-flip-step-{step}-v017.png'),animations='disabled')
            mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
            open_fixture(mobile,'home.html')
            assert mobile.locator('.mission-card .mission-cover-mark svg.mission-mark').count()==24
            for mission in ('mirrorfall','wildbond','stardoor'):
                open_fixture(mobile,f'{mission}.html')
                assert mobile.locator('.action-stage').count()==1
            browser.close()
    print('PASS: 24 distinct mission covers, 24 gameplay screens, mobile/desktop, and Mirrorfall inversion/return')

if __name__=='__main__':main()
