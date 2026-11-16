import test from 'node:test';
import assert from 'node:assert/strict';
import {candidateReadiness} from '../src/candidates.mjs';
const base={id:'gamestop-disc',retailer:'GameStop',kind:'disc',
 source:'live-retailer-purchase-surface',blocked:false,price:449.99,
 productEvidence:{editionHint:'disc'},probe:{status:'cart-not-orderable'},
 verdict:{qualifies:false}};
test('attractive GameStop price is explicitly not orderable',()=>{
 const r=candidateReadiness([base]);
 assert.equal(r.candidates[0].status,'attractive-price-but-not-orderable');
 assert.equal(r.candidates[0].alertEligible,false);
 assert.equal(r.attractiveUnverified,1);
});
test('an enabled purchase button is not verified checkout',()=>{
 const r=candidateReadiness([{...base,probe:{status:'cart-action-enabled-unverified'}}]);
 assert.equal(r.candidates[0].status,'attractive-price-checkout-unverified');
 assert.equal(r.candidates[0].alertEligible,false);
});
test('unknown edition cannot be a price candidate',()=>{
 const r=candidateReadiness([{...base,productEvidence:{editionHint:'unknown'}}]);
 assert.equal(r.candidates[0].status,'product-or-edition-unverified');
});
test('higher Sony page price does not trigger purchase claims',()=>{
 const r=candidateReadiness([{...base,id:'psdirect-disc',retailer:'PlayStation Direct',
   price:649,probe:{status:'price-above-target'}}]);
 assert.equal(r.candidates[0].status,'above-base-target-bundle-credits-unverified');
 assert.equal(r.candidates[0].alertEligible,false);
});
test('confirmed verdict is the only alert-eligible state',()=>{
 const r=candidateReadiness([{...base,verdict:{qualifies:true}}]);
 assert.equal(r.candidates[0].status,'verified-orderable');
 assert.equal(r.candidates[0].alertEligible,true);
});
test('missing price remains unverified',()=>{
 const r=candidateReadiness([{...base,price:null}]);
 assert.equal(r.candidates[0].status,'price-unreadable');
});
test('queue is ordered by research status without inventing availability',()=>{
 const r=candidateReadiness([
   {...base,id:'expensive',price:649},
   {...base,id:'cheap-but-unavailable'},
   {...base,id:'research',probe:{status:'cart-action-enabled-unverified'}}
 ]);
 assert.deepEqual(r.candidates.map(x=>x.id),['research','cheap-but-unavailable','expensive']);
});
