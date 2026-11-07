"""v0.20 browser regression: artwork, untypeable-line skip, and video-clock sync.
Remote YouTube and lyric services are simulated. Live provider timing needs user testing.
"""
from __future__ import annotations
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_v019 import open_app as open_old

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs'/'screenshots'
CSS=(ROOT/'web'/'styles'/'v020.css').read_text()

def open_app(browser,width=1440,height=900):
    page,errors=open_old(browser,width,height)
    page.add_style_tag(content=CSS)
    page.locator('.welcome-continue').click()
    page.locator('[data-action="lyric-open"]').first.click()
    return page,errors

def run():
    OUT.mkdir(exist_ok=True,parents=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
        page,errors=open_app(browser)
        assert page.locator('.lyric-album-art').count()==12
        first=page.locator('.lyric-album-art').first
        assert 'i.ytimg.com/vi/' in first.get_attribute('style'),first.get_attribute('style')[:250]
        assert 'data:image/svg+xml' in first.get_attribute('style')
        page.locator('.lyric-featured').screenshot(path=str(OUT/'music-artwork-v020.png'),animations='disabled')
        page.locator('[data-action="lyric-demo"]').click()
        assert page.locator('#lyric-live-text').inner_text().startswith('Signals through')
        page.locator('#lyric-toggle').click()
        page.locator('#lyric-input').press('Enter')
        assert page.locator('#lyric-skipped').inner_text()=='4'
        assert page.locator('#lyric-accuracy').inner_text()=='0%'
        assert page.locator('#lyric-progress').inner_text().startswith('4/')
        assert page.locator('.lyric-current-line').inner_text().startswith('Another city')
        page.locator('#lyric-input').fill('Another')
        page.locator('#lyric-input').press('Space')
        assert page.locator('#lyric-wpm').inner_text()!='-1'
        assert page.locator('#lyric-accuracy').inner_text()=='20%'
        page.locator('#lyric-input').fill('I cannot type this')
        page.locator('#lyric-input').press('Enter')
        assert page.locator('#lyric-skipped').inner_text()=='8'
        assert page.locator('#lyric-accuracy').inner_text()=='11%'
        page.locator('.lyric-typing-column').screenshot(path=str(OUT/'music-skip-v020.png'),animations='disabled')
        page.locator('[data-action="lyric-back"]').click()
        page.evaluate('''() => {
          window.fetch=async()=>({ok:true,status:200,json:async()=>[
           {id:15555,trackName:'New Multilingual Song',artistName:'Original Artist',duration:24,
            syncedLyrics:'[00:00.00] Zero hero now\\n[00:05.00] 안녕하세요 여러분\\n[00:10.00] Hello again later\\n[00:14.00] Keep moving'}]});
          window.__fakePlayerInstances=[];
          window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:class {
            constructor(id,options){this.options=options;this.t=0;this.rate=1;this.playing=false;
             window.__fakePlayerInstances.push(this);
             document.getElementById(id).innerHTML='<div class="fake-youtube">Simulated video stream</div>';
             Promise.resolve().then(()=>options.events.onReady());}
            getCurrentTime(){return this.t;}
            getDuration(){return 40;}
            getAvailablePlaybackRates(){return [.5,1,1.5,2];}
            setPlaybackRate(rate){this.rate=rate;this.options.events.onPlaybackRateChange({data:rate});}
            getPlaybackRate(){return this.rate;}
            playVideo(){this.playing=true;this.options.events.onStateChange({data:1});}
            pauseVideo(){this.playing=false;this.options.events.onStateChange({data:2});}
            seekTo(t){this.t=t;}
            destroy(){}
          }};
        }''')
        page.locator('#lyric-search-input').fill('New Multilingual Song')
        page.locator('#lyric-search-form button[type=submit]').click()
        page.locator('.lyric-song-result').first.wait_for(timeout=5000)
        art=page.locator('.lyric-result-art').first.get_attribute('style')
        assert 'data:image/svg+xml' in art and 'i.ytimg' not in art
        page.locator('.lyric-song-result').first.click()
        assert page.locator('.lyric-track-cover').count()==1
        page.locator('#lyric-video-url').fill('https://youtu.be/dQw4w9WgXcQ')
        page.locator('#lyric-video-form button[type=submit]').click()
        page.locator('.fake-youtube').wait_for(timeout=5000)
        assert 'different edits' in page.locator('#lyric-video-status').inner_text().lower()
        page.locator('[data-action="lyric-toggle"]').click()
        page.evaluate('window.__fakePlayerInstances.at(-1).t=11')
        page.wait_for_timeout(220)
        assert page.locator('#lyric-live-text').inner_text()=='Hello again later'
        assert page.locator('#lyric-current-line').inner_text()=='Zero hero now' # independent typing position
        assert '2 lyric lines behind' in page.locator('#lyric-lag-status').inner_text()
        page.locator('[data-action="lyric-calibrate"][data-index="1"]').click()
        assert page.locator('#lyric-offset').inner_text()=='-6.00s'
        assert page.locator('#lyric-live-text').inner_text()=='안녕하세요 여러분'
        page.locator('[data-action="lyric-offset-forward"]').click()
        assert page.locator('#lyric-offset').inner_text()=='-5.75s'
        page.locator('[data-action="lyric-jump"][data-index="1"]').click()
        assert 'Different alphabet' in page.locator('#lyric-typing-hint').inner_text()
        page.locator('#lyric-input').press('Enter')
        assert page.locator('#lyric-skipped').inner_text()=='2'
        assert page.locator('#lyric-accuracy').inner_text()=='0%'
        assert page.locator('.lyric-current-line').inner_text()=='Hello again later'
        page.screenshot(path=str(OUT/'music-video-sync-v020.png'),animations='disabled')
        page.locator('[data-action="lyric-back"]').click()
        page.locator('.lyric-song-result').first.click()
        assert page.locator('#lyric-offset').inner_text()=='-5.75s'
        assert not errors,errors
        mobile,mobile_errors=open_app(browser,390,844)
        assert mobile.locator('.lyric-album-art').count()==12
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        mobile.locator('[data-action="lyric-demo"]').click()
        assert mobile.locator('#lyric-skip').is_visible()
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        assert not mobile_errors,mobile_errors
        browser.close()
    print('PASS: YouTube artwork with vector fallback; generated catalog covers; scored Enter/Shift+Enter skips; accurate clock/line UI; per-video calibrated timing; mobile')

if __name__=='__main__':run()
