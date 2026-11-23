import test from 'node:test';
import assert from 'node:assert/strict';
import {percentile,makePerformanceReport} from '../web/ui/performance-check.js';

test('percentile honors empty samples and unsorted values',()=>{
 assert.equal(percentile([],.95),null);
 assert.equal(percentile([42],.95),42);
 assert.equal(percentile([60,2,24,14],.5),14);
 assert.equal(percentile([60,2,24,14],.95),60);
});

test('local report remains useful when long-task timing is unavailable',()=>{
 const report=makePerformanceReport({
  frameIntervals:3,frameMsTotal:60,slowFrames:0,maxFrameGap:24,
  inputEvents:2,inputFrameDelays:[12,26],modes:{'Speed Lab':2},
  longTasksSupported:false,longTasks:0,maxLongTask:0,
 },{elapsedMs:1200,reason:'Stopped by player',width:390,height:844,dpr:3,
 userAgent:'UnitTestBrowser/1'});
 assert.match(report,/Viewport: 390 × 844 CSS pixels/);
 assert.match(report,/50 per second/);
 assert.match(report,/Input-to-next-frame p95: 26 ms/);
 assert.match(report,/Not exposed by this browser/);
 assert.match(report,/Speed Lab: 2/);
 assert.match(report,/no typed text/i);
 assert.ok(!report.includes('PRIVATE_INPUT_SENSITIVE'));
});

test('long task counts and missing input samples are clearly distinguished',()=>{
 const report=makePerformanceReport({
  frameIntervals:0,frameMsTotal:0,slowFrames:0,maxFrameGap:0,
  inputEvents:0,inputFrameDelays:[],modes:{},longTasksSupported:true,
  longTasks:2,maxLongTask:127.8
 },{elapsedMs:10000,reason:'Completed',width:1440,height:900,dpr:1,userAgent:''});
 assert.match(report,/Average animation-frame cadence: Unavailable/);
 assert.match(report,/Input-to-next-frame p95: Not measured/);
 assert.match(report,/Long tasks \(>50ms\): 2/);
 assert.match(report,/Longest long task: 128 ms/);
 assert.match(report,/No practice input detected/);
});
