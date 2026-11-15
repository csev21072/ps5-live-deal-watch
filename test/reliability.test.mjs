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
