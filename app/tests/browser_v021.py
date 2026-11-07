"""v0.21 Chromium smoke: automated video matching, playback, and honest fallback.
The upstream lyrics and YouTube API are mocked. Live service coverage is not tested.
"""
import os
from playwright.sync_api import sync_playwright
from browser_v020 import open_app


def run():
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
        page,errors=open_app(browser)
        page.evaluate('''() => {
          window.__musicResolveCalls=0;
          window.__fakePlayerInstances=[];
          window.fetch=async(url)=>{
            if(String(url).startsWith('/api/music/resolve?')){
              window.__musicResolveCalls++;
              const params=new URL(String(url),'http://localhost').searchParams;
              if(params.get('title')==='Not Found') return {ok:true,status:200,json:async()=>({videoId:null,source:'none'})};
              return {ok:true,status:200,json:async()=>({videoId:'dQw4w9WgXcQ',source:'youtube',confidence:0.97})};
            }
            return {ok:true,status:200,json:async()=>[
              {id:21122,trackName:'Kiwi',artistName:'Harry Styles',duration:180,syncedLyrics:'[00:00.00] First apple song\\n[00:04.00] Second lyric line'},
              {id:21123,trackName:'Not Found',artistName:'A Singer',duration:50,syncedLyrics:'[00:00.00] No connected video\\n[00:05.00] But typing still works'}]};
          };
          window.YT={PlayerState:{PLAYING:1,PAUSED:2,ENDED:0},Player:class {
            constructor(id,options){this.options=options;this.t=0;this.rate=1;
             window.__fakePlayerInstances.push(this);
             document.getElementById(id).innerHTML='<div class="fake-youtube">Official YouTube embed simulated</div>';
             Promise.resolve().then(()=>options.events.onReady());}
            getCurrentTime(){return this.t;}
            getDuration(){return 180;}
            getAvailablePlaybackRates(){return [.5,1,1.5,2];}
            setPlaybackRate(rate){this.rate=rate;this.options.events.onPlaybackRateChange({data:rate});}
            getPlaybackRate(){return this.rate;}
            playVideo(){this.options.events.onStateChange({data:1});}
            pauseVideo(){this.options.events.onStateChange({data:2});}
            seekTo(t){this.t=t;}
            destroy(){}
          }};
        }''')
        page.locator('#lyric-search-input').fill('Harry Styles')
        page.locator('#lyric-search-form button[type=submit]').click()
        page.locator('.lyric-song-result').first.wait_for(timeout=5000)
        assert 'AUTO-MATCH VIDEO ON SELECT' in page.locator('.lyric-song-result').first.inner_text()
        page.locator('.lyric-song-result').first.click()
        page.locator('.fake-youtube').wait_for(timeout=5000)
        assert 'Video automatically matched' in page.locator('#lyric-video-status').inner_text()
        assert page.evaluate('window.__musicResolveCalls')==1
        assert page.evaluate('localStorage.getItem("panic.lyric.video.21122")')=='dQw4w9WgXcQ'
        page.locator('#lyric-toggle').click()
        page.locator('[data-action="lyric-speed-down"]').click()
        assert page.locator('#lyric-speed').inner_text()=='0.50×'
        page.locator('[data-action="lyric-back"]').click()
        page.locator('.lyric-song-result').first.click()
        page.locator('.fake-youtube').wait_for(timeout=5000)
        assert page.evaluate('window.__musicResolveCalls')==1  # remembered match
        page.locator('[data-action="lyric-back"]').click()
        page.locator('.lyric-song-result').nth(1).click()
        page.locator('.lyric-no-video').wait_for(timeout=5000)
        assert page.evaluate('window.__musicResolveCalls')==2
        assert 'automatic video match was not found' in page.locator('#lyric-video-status').inner_text()
        assert page.locator('#lyric-video-form').is_visible()
        assert not errors,errors
        browser.close()

if __name__=='__main__':run()
