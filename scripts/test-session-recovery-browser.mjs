import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

// Test the actual local-only frontend with deterministic WebSocket replies;
// nothing is hosted or exposed to the network.
const root=resolve(fileURLToPath(new URL('../app/web/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  const relative=path==='/'?'index.html':path.startsWith('/assets/')?path.slice(8):'';
  const file=resolve(root,relative);
  if(!relative||!file.startsWith(root+sep))throw new Error('Not found');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[file.slice(file.lastIndexOf('.'))]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise((ok,fail)=>server.once('error',fail).listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function until(check,label){
 for(let i=0;i<140;i++){const found=check();if(found)return found;await sleep(50);}
 throw Error('Timed out: '+label);
}
let browser;
async function fixture(width=390){
 const context=await browser.newContext({viewport:{width,height:844},
  isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'});
 const page=await context.newPage();
 page.setDefaultTimeout(10000);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const session={code:'ABC123',token:'private-test-token-do-not-render'};
 await page.addInitScript(value=>sessionStorage.setItem('panic.session',JSON.stringify(value)),session);
 let socket;
 const sent=[];
 await page.routeWebSocket('**/ws',ws=>{
  socket=ws;
  ws.onMessage(message=>{try{sent.push(JSON.parse(String(message)));}catch{sent.push({type:'bad'});}});
 });
 await page.goto(origin+'/?room='+session.code,{waitUntil:'domcontentloaded'});
 await page.locator('#app-main').waitFor();
 await until(()=>sent.some(msg=>msg.type==='reconnect'),'automatic reconnect');
 assert.deepEqual(sent[0],{type:'reconnect',code:session.code,token:session.token});
 return {context,page,session,sent,errors,
  getPass:()=>page.evaluate(()=>sessionStorage.getItem('panic.session')),
  send:message=>socket.send(JSON.stringify(message))};
}
async function checkPanel(f,kind,title){
 const panel=f.page.locator('.session-recovery');
 await panel.waitFor();
 assert.equal(await panel.getAttribute('data-recovery-kind'),kind);
 assert.match(await panel.locator('h2').innerText(),title);
 await f.page.waitForFunction(()=>document.activeElement?.id==='session-recovery-title');
 assert.equal(await panel.getAttribute('role'),'alert');
 assert.equal(await panel.getAttribute('aria-labelledby'),'session-recovery-title');
 assert.equal(await f.page.locator('main#app-main').count(),1);
 assert.doesNotMatch(await panel.evaluate(node=>node.outerHTML),/private-test-token-do-not-render/);
 return panel;
}
async function scenario(name,width,fn){
 const f=await fixture(width);
 try{
  await fn(f);
  assert.deepEqual(f.errors,[],name+' produces no browser errors');
  console.log('PASS '+name+' at '+width+'px');
 }finally{await f.context.close();}
}
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 await scenario('invalid pass prevents replay and opens a fresh room',390,async f=>{
  f.send({type:'error',message:'Your reconnect pass is no longer valid. private-test-token-do-not-render <img onerror=alert(1)>'});
  const panel=await checkPanel(f,'invalid',/RECONNECT PASS/);
  assert.equal(await f.getPass(),null,'spent pass is discarded');
  assert.equal(await panel.locator('[data-action="recovery-retry"]').count(),0);
  await f.page.keyboard.press('Tab');
  assert.equal(await f.page.evaluate(()=>document.activeElement?.dataset.action),'recovery-create');
  await f.page.keyboard.press('Enter');
  await f.page.locator('.modal-backdrop[data-mode="create"]').waitFor();
  await f.page.waitForFunction(()=>document.activeElement?.id==='callsign');
  assert.equal(await f.page.locator('.session-recovery').count(),0);
  assert.equal(f.sent.length,1,'spent pass cannot be replayed');
 });
 await scenario('expired room opens a new join without stale identity',1440,async f=>{
  f.send({type:'error',message:'Room expired. Start a new mission.'});
  const panel=await checkPanel(f,'expired',/ROOM HAS EXPIRED/);
  assert.equal(await f.getPass(),null);
  await panel.locator('[data-action="recovery-join"]').click();
  await f.page.locator('.modal-backdrop[data-mode="join"]').waitFor();
  await f.page.waitForFunction(()=>document.activeElement?.id==='callsign');
  assert.equal(f.sent.length,1);
 });
 await scenario('cooldown retains credential and needs an explicit retry',390,async f=>{
  const error={type:'error',message:'Too many room access attempts. Try again in a minute.'};
  f.send(error);
  let panel=await checkPanel(f,'cooldown',/TEMPORARILY LIMITED/);
  assert.equal(await f.getPass(),JSON.stringify(f.session));
  assert.equal(await panel.locator('[data-action="recovery-create"]').count(),0);
  await sleep(120);
  assert.equal(f.sent.length,1,'no automatic probing on cooldown');
  await panel.locator('[data-action="recovery-retry"]').click();
  await until(()=>f.sent.length===2,'user-triggered retry');
  assert.deepEqual(f.sent[1],{type:'reconnect',...f.session});
  assert.equal(await f.page.locator('.session-recovery').count(),0);
  f.send(error);
  panel=await checkPanel(f,'cooldown',/TEMPORARILY LIMITED/);
  assert.equal(await f.getPass(),JSON.stringify(f.session));
  await f.page.locator('[data-action="show-join"]:visible').first().click();
  await f.page.locator('.modal-backdrop[data-mode="join"]').waitFor();
  assert.equal(await f.getPass(),JSON.stringify(f.session),
   'opening join does not silently discard the saved pass');
 });
}finally{
 if(browser)await browser.close();
 await new Promise(ok=>server.close(ok));
}
console.log('Local co-op recovery browser regressions passed.');
