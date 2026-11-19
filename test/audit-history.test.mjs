import test from 'node:test';
import assert from 'node:assert/strict';
import {appendAuditHistory} from '../src/audit-history.mjs';
const evidence=(at)=>({checkedAt:at,coverage:{allRetailersAttempted:true,retailersWithoutVerifiedOffers:7},records:[
 {retailer:'GameStop',source:'live-retailer-purchase-surface',blocked:false,productEvidence:{productHeading:'PS5'},verdict:{qualifies:false}},
 {retailer:'Target',source:'unreadable',blocked:true,diagnostic:{status:'unreadable'},verdict:{qualifies:false}}
]});
test('audit history records coverage counts without product prices',()=>{
 const h=appendAuditHistory([],evidence('2026-11-15T22:00:00Z'));
 assert.equal(h.length,1);
 assert.equal(h[0].retailersAttempted,2);
 assert.equal(h[0].readableProductPages,1);
 assert.equal(h[0].unreadablePages,1);
 assert.equal(h[0].verifiedOffers,0);
 assert.ok(!JSON.stringify(h).includes('GameStop'));
 assert.equal(h[0].gapSincePreviousHours,null);
});
test('gap between hourly runs is measurable without claiming missed jobs',()=>{
 const h=appendAuditHistory(appendAuditHistory([],evidence('2026-11-15T20:00:00Z')),evidence('2026-11-15T22:30:00Z'));
 assert.equal(h[1].gapSincePreviousHours,2.5);
});
test('reprocessing same timestamp does not duplicate history',()=>{
 const a=evidence('2026-11-15T22:00:00Z');
 assert.equal(appendAuditHistory(appendAuditHistory([],a),a).length,1);
});
test('history is bounded to 168 entries',()=>{
 let h=[];
 for(let i=0;i<180;i++)h=appendAuditHistory(h,evidence(new Date(Date.UTC(2026,10,1,i)).toISOString()));
 assert.equal(h.length,168);
});
test('invalid previous history fails closed',()=>assert.throws(()=>appendAuditHistory({},evidence('2026-11-15T22:00:00Z'))));
test('missing scan records fail closed',()=>assert.throws(()=>appendAuditHistory([],{checkedAt:'2026-11-15T22:00:00Z'})));
test('historical gaps preserve chronological order',()=>{
 const h=appendAuditHistory([{checkedAt:'2026-11-15T23:00:00Z'}],evidence('2026-11-15T22:00:00Z'));
 assert.equal(h[0].checkedAt,'2026-11-15T22:00:00Z');
 assert.equal(h[1].gapSincePreviousHours,1);
});


test('audit history retains public run identity and rerun attempt',()=>{
 const h=appendAuditHistory([],{...evidence('2026-11-15T22:00:00Z'),runId:'43785314907',runAttempt:2});
 assert.equal(h[0].runId,'43785314907');assert.equal(h[0].runAttempt,2);
});
