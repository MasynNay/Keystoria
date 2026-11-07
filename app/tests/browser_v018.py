"""Live DOM interactions for Lyric Lab using the real frontend controller.

Network is blocked in this execution environment. Only WebSocket, remote lyrics
transport, and the YouTube iframe transport are stubbed; assertions test the
actual browser UI, event handlers, scoring, and responsive layout.
"""
from __future__ import annotations
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_offline import module_url, STUBS

ROOT=Path(__file__).resolve().parents[1]
WEB=ROOT/'web'
OUT=ROOT/'docs'/'screenshots'
CSS=[WEB/'styles.css',WEB/'styles'/'typing.css',WEB/'styles'/'speed.css',
     *[WEB/'styles'/f'{v}.css' for v in ['v06','v07','v08','v09','v010','v011','v012','v013','v014','v015','v017','v018']]]
STYLES='\n'.join(f.read_text() for f in CSS)


def open_app(browser,width,height):
    page=browser.new_page(viewport={'width':width,'height':height})
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.set_content(f'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{STYLES}</style></head><body data-theme="station"><div class="grain"></div><div id="app"></div><div id="toast-layer"></div></body></html>',wait_until='domcontentloaded')
    page.evaluate(STUBS)
    module=module_url(WEB/'app.js',{})
    result=page.evaluate("url=>import(url).then(()=> 'ok').catch(err=>String(err))",module)
    assert result=='ok',result
    return page,errors


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
        page,errors=open_app(browser,1440,900)
        assert page.locator('.welcome-continue').count()==1
        page.locator('.welcome-continue').click()
        mission_cards=page.locator('.mission-card')
        assert mission_cards.count()==24,mission_cards.count()
        colors=mission_cards.evaluate_all('(els)=>els.map(el=>getComputedStyle(el).getPropertyValue("--mission-ink").trim())')
        assert len(set(colors))==24,colors
        assert page.locator('[data-mission="mirrorfall"] .mission-crest-caption').count()==1
        page.locator('.operations').screenshot(path=str(OUT/'eighteen-colors-v018.png'),animations='disabled')
        page.locator('[data-action="lyric-open"]').first.click()
        assert page.locator('.lyric-album').count()==12
        assert page.locator('.lyric-game-grid').count()==0
        page.screenshot(path=str(OUT/'lyric-lab-catalog-v018.png'),full_page=True,animations='disabled')
        page.locator('[data-action="lyric-demo"]').click()
        assert page.locator('.lyric-game-grid').count()==1
        assert page.locator('.lyric-original-visual').count()==1
        assert page.locator('#lyric-progress').inner_text().startswith('0/')
        page.locator('[data-action="lyric-toggle"]').click()
        box=page.locator('#lyric-input')
        for word in ['Signals','through','the','night']:
            box.fill(word)
            box.press('Space')
        assert page.locator('#lyric-progress').inner_text().startswith('4/'),page.locator('#lyric-progress').inner_text()
        assert page.locator('#lyric-accuracy').inner_text()=='100%'
        assert page.locator('#lyric-streak').inner_text()=='4'
        box.fill('wrong');box.press('Space')
        assert int(page.locator('#lyric-streak').inner_text())==0
        assert int(page.locator('#lyric-accuracy').inner_text().replace('%',''))<100
        page.locator('[data-action="lyric-offset-forward"]').click()
        assert page.locator('#lyric-offset').inner_text()=='+0.5s'
        page.screenshot(path=str(OUT/'lyric-lab-playing-v018.png'),full_page=True,animations='disabled')
        print('step: back',flush=True)
        page.locator('[data-action="lyric-back"]').click()
        assert page.locator('.lyric-album').count()==12
        # Test song discovery without contacting external services.
        print('step: mock fetch',flush=True)
        page.evaluate('''() => {
          window.fetch = async () => ({ok:true,status:200,json:async()=>[
            {id:71,trackName:'Never Gonna Give You Up',artistName:'Rick Astley',duration:220,
             syncedLyrics:'[00:00.00] Original test phrase\\n[00:02.00] Another original line'}]
          });
          window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:class {
           constructor(id,options){this.options=options;this.t=0;this.playing=false;
            const el=document.getElementById(id);el.innerHTML='<div class="fake-youtube" style="width:100%;height:100%;background:#373043;display:grid;place-items:center">YouTube test player</div>';
            Promise.resolve().then(()=>options.events.onReady());}
           getCurrentTime(){return this.t;}
           playVideo(){this.playing=true;this.options.events.onStateChange({data:1});}
           pauseVideo(){this.playing=false;this.options.events.onStateChange({data:2});}
           seekTo(t){this.t=t;}
           destroy(){}
          }};
        }''')
        print('step: choose song',flush=True)
        page.locator('[data-action="lyric-featured"][data-index="0"]').click()
        print('step: click returned',flush=True)
        page.locator('.lyric-game-grid').wait_for(timeout=5000)
        print('step: game visible',flush=True)
        assert page.locator('.fake-youtube').count()==1
        assert page.locator('.lyric-current-line').inner_text().startswith('Original')
        print('step: toggle video',flush=True)
        page.locator('[data-action="lyric-toggle"]').click()
        assert page.locator('#lyric-toggle').inner_text().startswith('Ⅱ')
        page.locator('[data-action="lyric-back"]').click()
        page.locator('[data-action="lyric-home"]').click()
        assert page.locator('.welcome-modal').count()==1
        assert not errors,errors
        print('step: mobile',flush=True)
        mobile,errors_mobile=open_app(browser,390,844)
        mobile.locator('.welcome-continue').click()
        mobile.locator('[data-action="lyric-open"]').first.click()
        assert mobile.locator('.lyric-album').count()==12
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        mobile.screenshot(path=str(OUT/'lyric-lab-mobile-v018.png'),full_page=True,animations='disabled')
        mobile.locator('[data-action="lyric-demo"]').click()
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        assert not errors_mobile,errors_mobile
        browser.close()
    print('PASS: 24 cover colors, Lyric Lab catalog and demo, word scoring, YouTube integration mock, search, mobile layout')

if __name__=='__main__':main()
