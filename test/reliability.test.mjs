import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeReliability} from '../src/reliability.mjs';
const row=(hour,retailers=7,verified=0)=>({
 checkedAt:new Date(Date.UTC(2026,10,15,hour)).toISOString(),
 retailersAttempted:retailers,verifiedOffers:verified
});
test('empty history cannot claim successful hourly operation',()=>{
 const r=summarizeReliability([]);
 assert.equal(r.status,'no-history');
 assert.equal(r.observedRuns,0);
});
test('observed 2.5-hour gap is reported, not called a missed scheduled run',()=>{
 const r=summarizeReliability([row(8),row(10),row(11)]);
 assert.equal(r.longObservedGaps,1);
 assert.equal(r.maxObservedGapHours,2);
 assert.equal(r.status,'observational-only');
 assert.match(r.caveat,/not proof/);
});
test('retailer attempts and verified checkout are distinct',()=>{
 const r=summarizeReliability([row(8,7),row(9,6),row(10,7,1)]);
 assert.equal(r.fullyAttemptedSevenRetailers,2);
 assert.equal(r.runsWithPartialRetailerAttempts,1);
 assert.equal(r.verifiedOffersObserved,1);
});
test('unordered history is sorted by completion time',()=>{
 const r=summarizeReliability([row(10),row(8),row(9)]);
 assert.equal(r.latestCompletedAt,row(10).checkedAt);
 assert.equal(r.maxObservedGapHours,1);
});
test('malformed entries are excluded rather than counted',()=>{
 const r=summarizeReliability([{},row(10),{checkedAt:'not-a-date'}]);
 assert.equal(r.observedRuns,1);
});
test('a long gap is not inferred with only one completed run',()=>{
 const r=summarizeReliability([row(10)]);
 assert.equal(r.maxObservedGapHours,null);
 assert.equal(r.longObservedGaps,0);
});

test('development push scans do not count as unattended hourly schedule proof',()=>{
 const runs=[row(8),row(9),row(10)].map(x=>({...x,triggerType:'push'}));
 const r=summarizeReliability(runs);
 assert.equal(r.observedRuns,3);
 assert.equal(r.scheduledRuns,0);
 assert.equal(r.developmentPushRuns,3);
 assert.equal(r.lastScheduledAt,null);
 assert.equal(r.scheduledMaxObservedGapHours,null);
});
test('scheduled gaps are computed from scheduled runs only',()=>{
 const r=summarizeReliability([
  {...row(8),triggerType:'schedule'},
  {...row(9),triggerType:'push'},
  {...row(10),triggerType:'schedule'},
  {...row(11),triggerType:'workflow_dispatch'},
  {...row(12),triggerType:'schedule'}
 ]);
 assert.equal(r.scheduledRuns,3);
 assert.equal(r.manualRuns,1);
 assert.equal(r.developmentPushRuns,1);
 assert.equal(r.scheduledLongObservedGaps,2);
 assert.equal(r.scheduledMaxObservedGapHours,2);
});
test('legacy entries with no trigger type remain unknown, not scheduled',()=>{
 const r=summarizeReliability([row(8),row(9)]);
 assert.equal(r.unknownTriggerRuns,2);
 assert.equal(r.scheduledRuns,0);
});


test('fresh manual scan does not hide a ten-hour scheduled gap',()=>{
 const r=summarizeReliability([
  {...row(0),triggerType:'schedule'}, {...row(1),triggerType:'schedule'},
  {...row(11),triggerType:'workflow_dispatch'}
 ],Date.parse(row(11).checkedAt));
 assert.equal(r.cadence.health,'degraded');
 assert.equal(r.cadence.lastScheduledAgeHours,10);
 assert.equal(r.cadence.scheduledCompletionsLast24Hours,2);
});
test('new schedule evidence cannot prematurely establish hourly reliability',()=>{
 const r=summarizeReliability([{...row(9),triggerType:'schedule'}],Date.parse(row(10).checkedAt));
 assert.equal(r.cadence.health,'collecting-evidence');
});
test('a fully observed day can establish historical cadence only',()=>{
 const history=Array.from({length:25},(_,i)=>({...row(i),triggerType:'schedule'}));
 const r=summarizeReliability(history,Date.parse(row(24).checkedAt));
 assert.equal(r.cadence.health,'hourly-cadence-observed');
 assert.equal(r.cadence.scheduledCompletionsLast24Hours,24);
 assert.equal(r.cadence.observationWindowHours,24);
});
test('recent completion cannot hide earlier gaps within the same day',()=>{
 const history=[0,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map(i=>({...row(i),triggerType:'schedule'}));
 const r=summarizeReliability(history,Date.parse(row(24).checkedAt));
 assert.equal(r.cadence.health,'degraded');
 assert.equal(r.cadence.maxScheduledGapInWindowHours,10);
});
test('future and duplicate times do not inflate cadence evidence',()=>{
 const entry={...row(10),triggerType:'schedule'};
 const r=summarizeReliability([entry,entry,{...row(12),triggerType:'schedule'}],Date.parse(row(11).checkedAt));
 assert.equal(r.cadence.scheduledCompletionsLast24Hours,1);
 assert.equal(r.cadence.lastScheduledAgeHours,1);
 assert.equal(r.cadence.health,'collecting-evidence');
});
test('reliability snapshot ages even when no additional run has finished',()=>{
 const history=[{...row(10),triggerType:'schedule'}];
 assert.equal(summarizeReliability(history,Date.parse(row(11).checkedAt)).cadence.health,'collecting-evidence');
 assert.equal(summarizeReliability(history,Date.parse(row(12).checkedAt)).cadence.health,'degraded');
 assert.throws(()=>summarizeReliability(history,'invalid'),/Invalid/);
});
