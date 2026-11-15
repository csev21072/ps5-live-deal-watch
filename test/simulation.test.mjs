import test from 'node:test';
import assert from 'node:assert/strict';
import {runFictionalSimulation} from '../scripts/simulate-offers.mjs';
import {fictionalOffer} from './fixtures/fictional-offer.mjs';
import {evaluate} from '../src/rules.mjs';
import {transition} from '../src/alerts/state.mjs';
import {buildVerifiedIssue} from '../src/alerts/issue.mjs';

const now=Date.parse('2026-11-15T22:00:00Z');
test('offline fictional scenario runs without sending anything',()=>{
 const r=runFictionalSimulation(now);
 assert.match(r.label,/FICTIONAL OFFLINE/);
 assert.equal(r.githubApiCalls,0);
 assert.equal(r.retailerRequests,0);
 assert.equal(r.purchases,0);
 assert.equal(r.results.length,9);
});
test('first verified fictional offer would format an owner-assigned issue',()=>{
 const record=fictionalOffer(now);
 const verdict=evaluate(record,now);
 const decision=transition(null,record,verdict);
 assert.equal(verdict.qualifies,true,verdict.reasons.join(', '));
 assert.equal(decision.alert,true);
 const issue=buildVerifiedIssue(record,verdict,decision,{},'csev21072/ps5-live-deal-watch');
 assert.equal(issue.assignees[0],'csev21072');
 assert.match(issue.title,/PS5 VERIFIED/);
 assert.match(issue.body,/Phoenix 85001/);
 assert.match(issue.body,/Alert event key: [0-9a-f]{64}/);
});
test('fictional negative scenarios cannot format alerts',()=>{
 const r=runFictionalSimulation(now);
 for(const name of ['wrong Phoenix ZIP','unverified seller identity','CAPTCHA']){
   const scenario=r.results.find(x=>x.scenario===name);
   assert.equal(scenario.qualifies,false,name);
   assert.equal(scenario.alertWouldBeCreated,false,name);
   assert.equal(scenario.issueTitlePreview,null);
 }
});
test('duplicates and unchanged prices remain silent',()=>{
 const r=runFictionalSimulation(now);
 for(const name of ['unchanged duplicate','unchanged lower price']){
   assert.equal(r.results.find(x=>x.scenario===name).alertWouldBeCreated,false);
 }
});
test('a real state transition would alert on a verified restock and price drop',()=>{
 const r=runFictionalSimulation(now);
 assert.equal(r.results.find(x=>x.scenario==='fictional verified restock').alertWouldBeCreated,true);
 assert.equal(r.results.find(x=>x.scenario==='verified material price drop').alertWouldBeCreated,true);
});
test('issue formatter refuses a non-qualifying offer',()=>{
 const record=fictionalOffer(now,{blocked:true});
 assert.throws(()=>buildVerifiedIssue(record,evaluate(record,now),{alert:true},{},'csev21072/ps5-live-deal-watch'));
});
test('issue formatter refuses a non-alerting duplicate',()=>{
 const record=fictionalOffer(now);
 assert.throws(()=>buildVerifiedIssue(record,evaluate(record,now),{alert:false},{},'csev21072/ps5-live-deal-watch'));
});
test('issue formatter refuses an invalid destination',()=>{
 const record=fictionalOffer(now);
 assert.throws(()=>buildVerifiedIssue(record,evaluate(record,now),{alert:true},{},'not-a-repository'));
});
test('same fictional offer produces stable deduplication event key',()=>{
 const record=fictionalOffer(now);
 const verdict=evaluate(record,now);
 const decision=transition(null,record,verdict);
 const a=buildVerifiedIssue(record,verdict,decision,{},'csev21072/ps5-live-deal-watch');
 const b=buildVerifiedIssue(record,verdict,decision,{},'csev21072/ps5-live-deal-watch');
 assert.equal(a.eventKey,b.eventKey);
});
