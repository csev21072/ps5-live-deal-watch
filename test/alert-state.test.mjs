import test from 'node:test';
import assert from 'node:assert/strict';
import {transition,processRecords,confirmedUnavailable,offerSignature} from '../src/alerts/state.mjs';
const offer=(price=449)=>({
 id:'gamestop-disc-bundle',retailer:'GameStop',kind:'disc',skuOrBundle:'SKU-422135',
 condition:'NEW',seller:'GameStop',shipper:'GameStop',controllers:1,
 storage:'1TB',discDrive:true,price,checkedAt:'2026-11-15T22:00:00Z',
 fulfillment:{method:'ship-to-home',zip:'85001'},conditions:'none'
});
const verified={qualifies:true};
const unknown={qualifies:false};
const soldout=(id='gamestop-disc-bundle')=>({
 id,retailer:'GameStop',source:'live-retailer-purchase-surface',
 unavailable:true,blocked:false,diagnostic:{status:'unavailable'},
 probe:{status:'shipping-unavailable'},checkedAt:'2026-11-15T22:10:00Z'
});
test('first fully verified offer alerts',()=>{
 const d=transition(null,offer(),verified);
 assert.equal(d.alert,true);assert.equal(d.reason,'first-verified-offer');
});
test('unchanged offer never repeats',()=>{
 const first=transition(null,offer(),verified);
 const d=transition(first.next,offer(),verified);
 assert.equal(d.alert,false);assert.equal(d.reason,'unchanged-verified-offer');
});
test('minor price movement does not alert',()=>{
 const first=transition(null,offer(),verified);
 assert.equal(transition(first.next,offer(445),verified).alert,false);
});
test('cumulative material price change alerts once',()=>{
 const first=transition(null,offer(),verified);
 const second=transition(first.next,offer(443),verified);
 assert.equal(second.alert,true);
 assert.equal(transition(second.next,offer(443),verified).alert,false);
});
test('seller or conditions change alerts',()=>{
 const first=transition(null,offer(),verified);
 const x={...offer(),seller:'Different Seller'};
 assert.equal(transition(first.next,x,verified).reason,'material-terms-change');
});
test('verified sold-out then same verified offer re-alerts',()=>{
 const first=transition(null,offer(),verified);
 const gone=transition(first.next,soldout(),unknown);
 assert.equal(gone.alert,false);assert.equal(gone.next.status,'confirmed-unavailable');
 const back=transition(gone.next,offer(),verified);
 assert.equal(back.alert,true);assert.equal(back.reason,'verified-restock');
});
test('CAPTCHA does not become a sold-out event',()=>{
 const first=transition(null,offer(),verified);
 const blocked={...soldout(),blocked:true};
 const d=transition(first.next,blocked,unknown);
 assert.equal(d.reason,'incomplete-or-unverified');
 assert.equal(transition(d.next,offer(),verified).alert,false);
});
test('catalog unavailable badge does not establish restock',()=>{
 const first=transition(null,offer(),verified);
 const d=transition(first.next,{...soldout(),retailer:'PlayStation Direct'},unknown);
 assert.equal(d.reason,'incomplete-or-unverified');
});
test('unknown scan preserves previously verified status',()=>{
 const first=transition(null,offer(),verified);
 const d=transition(first.next,{id:offer().id,checkedAt:'2026-11-15T22:15:00Z'},unknown);
 assert.equal(d.next.status,'verified-orderable');
 assert.equal(d.next.lastAlert.price,449);
});
test('unknown price without verified verdict never alerts',()=>{
 assert.equal(transition(null,offer(100),unknown).alert,false);
});
test('two different products have independent alert state',()=>{
 const a=offer(),b={...offer(),id:'gamestop-digital-bundle',kind:'digital'};
 const r=processRecords({},[a,b],[verified,verified]);
 assert.equal(r.alerts.length,2);
 assert.equal(Object.keys(r.next).length,2);
});
test('signature changes when membership changes',()=>{
 const a=offer(),b={...offer(),membershipRequired:true};
 assert.notEqual(offerSignature(a),offerSignature(b));
});
test('missing product-specific evidence is not confirmed unavailable',()=>{
 const a={...soldout(),probe:null};
 assert.equal(confirmedUnavailable(a),false);
});
