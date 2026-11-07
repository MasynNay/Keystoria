"""Real Chromium interactions for v0.19. Network and YouTube transport mocked.
No claim that remote YouTube embeds can be tested offline.
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
     *[WEB/'styles'/f'{v}.css' for v in ['v06','v07','v08','v09','v010','v011','v012','v013','v014','v015','v017','v018','v019']]]
STYLES='\n'.join(f.read_text() for f in CSS)

def open_app(browser,width,height):
    page=browser.new_page(viewport={'width':width,'height':height})
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.set_content(f'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>{STYLES}</style></head><body data-theme="station"><div class="grain"></div><div id="app"></div><div id="toast-layer"></div></body></html>',wait_until='domcontentloaded')
    page.evaluate(STUBS)
    result=page.evaluate("url=>import(url).then(()=> 'ok').catch(err=>String(err))",module_url(WEB/'app.js',{}))
    assert result=='ok',result
    return page,errors

def run():
    OUT.mkdir(exist_ok=True,parents=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
        page,errors=open_app(browser,1440,900)
        page.locator('.welcome-continue').click()
        assert page.locator('.mission-card:visible').count()==3
        assert page.locator('[data-action="toggle-missions"]').get_attribute('aria-expanded')=='false'
        page.locator('.operations').screenshot(path=str(OUT/'mission-preview-v019.png'),animations='disabled')
        page.locator('[data-action="toggle-missions"]').click()
        assert page.locator('.mission-card:visible').count()==24
        assert page.locator('[data-action="toggle-missions"]').get_attribute('aria-expanded')=='true'
        page.locator('[data-mission="stardoor"]').click()
        page.locator('[data-action="toggle-missions"]').click()
        assert page.locator('.mission-card:visible').count()==4  # 3 starters + current selection
        assert page.locator('[data-mission="stardoor"]').is_visible()
        page.locator('[data-action="lyric-open"]').first.click()
        page.locator('[data-action="lyric-demo"]').click()
        assert page.locator('#lyric-speed').inner_text()=='1.00×'
        page.locator('[data-action="lyric-speed-down"]').click()
        assert page.locator('#lyric-speed').inner_text()=='0.75×'
        page.locator('[data-action="lyric-speed-down"]').click()
        assert page.locator('#lyric-speed').inner_text()=='0.50×'
        page.locator('[data-action="lyric-speed-up"]').click()
        assert page.locator('#lyric-speed').inner_text()=='0.75×'
        page.locator('[data-action="lyric-speed-reset"]').click()
        assert page.locator('#lyric-speed').inner_text()=='1.00×'
        page.locator('[data-action="lyric-toggle"]').click()
        assert page.locator('#lyric-toggle').inner_text().startswith('Ⅱ')
        page.locator('[data-action="lyric-back"]').click()
        # Non-featured song returns timed lyrics without a video; connect one by URL.
        page.evaluate('''() => {
          window.fetch=async()=>({ok:true,status:200,json:async()=>[
           {id:9876,trackName:'Test Discovery',artistName:'Original Artist',duration:45,
            syncedLyrics:'[00:00.00] First sample line\\n[00:05.00] Second sample line'}]});
          window.__fakePlayerInstances=[];
          window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:class {
            constructor(id,options){this.options=options;this.t=0;this.rate=1;this.playing=false;
             window.__fakePlayerInstances.push(this);
             const el=document.getElementById(id);el.innerHTML='<div class="fake-youtube">Test YouTube Player</div>';
             Promise.resolve().then(()=>options.events.onReady());}
            getCurrentTime(){return this.t;}
            getAvailablePlaybackRates(){return [.5,1,1.5,2];}
            setPlaybackRate(rate){this.rate=rate;this.options.events.onPlaybackRateChange({data:rate});}
            getPlaybackRate(){return this.rate;}
            playVideo(){this.playing=true;this.options.events.onStateChange({data:1});}
            pauseVideo(){this.playing=false;this.options.events.onStateChange({data:2});}
            seekTo(t){this.t=t;}
            destroy(){}
          }};
        }''')
        page.locator('#lyric-search-input').fill('Test Discovery')
        page.locator('#lyric-search-form button[type=submit]').click()
        page.locator('.lyric-song-result').first.wait_for(timeout=5000)
        page.locator('.lyric-song-result').first.click()
        assert page.locator('.lyric-no-video').count()==1
        assert page.locator('#lyric-video-form').is_visible()
        assert 'Test%20Discovery' in page.locator('.lyric-find-video').get_attribute('href')
        page.locator('#lyric-video-url').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        page.locator('#lyric-video-form button[type=submit]').click()
        page.locator('.fake-youtube').wait_for(timeout=5000)
        assert page.locator('.lyric-no-video').count()==0
        assert page.locator('#lyric-speed').inner_text()=='1.00×'
        page.locator('[data-action="lyric-speed-down"]').click()
        assert page.locator('#lyric-speed').inner_text()=='0.50×'  # available player rates only
        assert page.evaluate('window.__fakePlayerInstances.at(-1).rate')==.5
        page.locator('[data-action="lyric-speed-up"]').click()
        assert page.locator('#lyric-speed').inner_text()=='1.00×'
        page.locator('[data-action="lyric-toggle"]').click()
        assert page.locator('#lyric-toggle').inner_text().startswith('Ⅱ')
        page.screenshot(path=str(OUT/'lyric-linked-video-v019.png'),animations='disabled')
        page.locator('[data-action="lyric-back"]').click()
        page.locator('.lyric-song-result').first.click()
        assert page.locator('.fake-youtube').count()==1  # cached association
        assert not errors,errors
        mobile,mobile_errors=open_app(browser,390,844)
        mobile.locator('.welcome-continue').click()
        assert mobile.locator('.mission-card:visible').count()==3
        mobile.locator('[data-action="lyric-open"]').first.click()
        mobile.locator('[data-action="lyric-demo"]').click()
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        mobile.locator('[data-action="lyric-speed-down"]').click()
        assert mobile.locator('#lyric-speed').inner_text()=='0.75×'
        assert not mobile_errors,mobile_errors
        browser.close()
    print('PASS: compact mission gallery, all 24 expansion, offline speed, non-featured video linking, YouTube playback speed, saved video, mobile')

if __name__=='__main__':run()
