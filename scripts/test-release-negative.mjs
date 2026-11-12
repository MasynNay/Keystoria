/** Prove a passing browser smoke test actually catches critical page regressions.
 * These fixtures intercept only test-browser HTTP responses, never modify the
 * checked-out Pages files, and must fail for the expected reason.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

for(const [fault,reason] of [
 ['broken-link',/public Play link must be present/],
 ['missing-app',/waiting for locator\('#app \.brand-name'\)/],
]){
 const child=spawnSync(process.execPath,['scripts/test-release-browser.mjs'],{
  encoding:'utf8',timeout:30000,maxBuffer:1024*1024*2,
  env:{...process.env,KEYSTORIA_QA_FAULT:fault},
 });
 const output=String(child.stdout||'')+'\n'+String(child.stderr||'');
 assert.equal(child.error,undefined,'fixture did not crash or exceed timeout: '+String(child.error));
 assert.notEqual(child.status,0,'release smoke must reject '+fault);
 assert.match(output,reason,'release smoke must fail for the injected '+fault+' defect, not an unrelated error');
 console.log('PASS: Release gate rejected injected '+fault);
}
