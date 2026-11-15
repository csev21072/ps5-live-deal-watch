import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCoverage} from '../src/coverage.mjs';
const retailers=['Target','GameStop','Amazon'];
const record=(retailer,overrides={})=>({
 retailer,source:'live-retailer-purchase-surface',blocked:false,
 diagnostic:{status:'candidate-needs-fulfillment-verification'},
 productEvidence:{productHeading:'PlayStation 5 Slim Disc'},
 verdict:{qualifies:false},...overrides
});
test('attempted retailer is not a verified retailer',()=>{
 const s=summarizeCoverage(retailers.map(x=>record(x)),{coverage:[]},retailers);
 assert.equal(s.allRetailersAttempted,true);
 assert.equal(s.retailersWithVerifiedOffer,0);
 assert.equal(s.retailersWithoutVerifiedOffers,3);
 assert.ok(s.retailerResults.every(x=>x.status==='product-pages-inspected-checkout-unverified'));
});
test('a blocked retailer is counted separately from readable pages',()=>{
 const s=summarizeCoverage([
  record('Target',{source:'unreadable',blocked:true,diagnostic:{status:'unreadable'},productEvidence:null}),
  record('GameStop'),record('Amazon')
 ],{coverage:[]},retailers);
 assert.equal(s.retailerResults[0].status,'all-pages-unreadable-or-blocked');
 assert.equal(s.retailerResults[0].unreadablePages,1);
});
test('partial retailer coverage is not misreported as full',()=>{
 const s=summarizeCoverage([record('Target'),record('Target',{blocked:true,diagnostic:{status:'blocked'}})],{},['Target']);
 assert.equal(s.retailerResults[0].status,'partial-coverage');
 assert.equal(s.retailerResults[0].attemptedPages,2);
});
test('unattempted retailer remains explicit',()=>{
 const s=summarizeCoverage([record('Target')],{},retailers);
 assert.equal(s.allRetailersAttempted,false);
 assert.equal(s.retailersAttempted,1);
 assert.equal(s.retailerResults[2].status,'not-checked');
});
test('a single qualifying offer does not imply complete retailer inventory',()=>{
 const s=summarizeCoverage([record('Target',{verdict:{qualifies:true}})],{},['Target']);
 assert.equal(s.retailerResults[0].status,'verified-offer-observed');
 assert.equal(s.retailersWithVerifiedOffer,1);
 assert.equal('allRetailersFullyVerified' in s,false);
});
test('search page discovery does not count as product checkout',()=>{
 const s=summarizeCoverage([],{coverage:[{retailer:'Target',status:'attempted',found:2}]},['Target']);
 assert.equal(s.retailerResults[0].status,'not-checked');
 assert.equal(s.retailerResults[0].discoveryStatus,'attempted');
});

test('one verified offer does not conceal other blocked pages at the same retailer',()=>{
 const s=summarizeCoverage([
  record('Target',{verdict:{qualifies:true}}),
  record('Target',{source:'unreadable',blocked:true,diagnostic:{status:'unreadable'},productEvidence:null})
 ],{},['Target']);
 assert.equal(s.retailerResults[0].status,'verified-offer-observed-partial-coverage');
 assert.equal(s.retailersWithVerifiedOffer,1);
 assert.equal(s.retailerResults[0].unreadablePages,1);
});
