import test from 'node:test';
import assert from 'node:assert/strict';
import {extractVisibleSignals,summarize} from '../src/diagnostics.mjs';
const product={id:'gamestop-digital-bundle'};
const scan=(body,title='Sony PlayStation 5 Slim Digital',priceText='$374.99')=>extractVisibleSignals({body,title,priceText},product);
test('GameStop shipping Not Available is unavailable, never a candidate',()=>{
 const r=scan('New $374.99 Ship to Home: Not Available Pick up in-store Find a Store');
 assert.equal(r.status,'unavailable');assert.equal(r.unavailable,true);
});
test('GameStop not available even if generic cart text present',()=>{
 const r=scan('Add to Cart. Same Day Delivery: Not Available');
 assert.equal(r.status,'unavailable');
});
test('CAPTCHA takes precedence over any price or availability',()=>{
 const r=scan('Press & hold to confirm you are a human. In stock. Shipping available.');
 assert.equal(r.status,'blocked');
});
test('price hidden in cart cannot become a candidate price',()=>{
 const r=scan('See price in cart, In Stock','PlayStation 5 Console','');
 assert.equal(r.status,'price-unreadable');
});
test('unrelated landing page is not product confirmation',()=>{
 const r=scan('Buy TVs, games and controllers','Welcome to Store','$399.99');
 assert.equal(r.status,'product-not-confirmed');
});
test('possible candidate still needs actual checkout verification',()=>{
 const r=scan('New PlayStation 5 Console. Ship to Home. Add to Cart.');
 assert.equal(r.status,'candidate-needs-fulfillment-verification');
});
test('status summary distinguishes unreadable and blocked',()=>{
 const r=summarize([
 {retailer:'GameStop',diagnostic:{status:'unavailable'},verdict:{qualifies:false}},
 {retailer:'Amazon',diagnostic:{status:'blocked'},verdict:{qualifies:false}},
 {retailer:'Target',verdict:{qualifies:false}}
 ]);
 assert.equal(r.attempted,3);assert.equal(r.confirmedPurchaseOffers,0);
 assert.equal(r.statusCounts.unreadable,1);assert.equal(r.statusCounts.blocked,1);
});
