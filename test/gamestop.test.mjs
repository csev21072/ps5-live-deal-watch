import test from 'node:test';
import assert from 'node:assert/strict';
import {probeGameStop,fulfillmentEvidence} from '../src/probes/gamestop.mjs';
const product={retailer:'GameStop',id:'gamestop-digital-bundle'};
const page=(body,title='Sony PlayStation 5 Slim')=>({
 title:async()=>title,
 locator:(selector)=>selector==='body'?{innerText:async()=>body}:{count:async()=>0},
 getByRole:()=>({first:()=>({isVisible:async()=>false,isEnabled:async()=>false})})
});
test('does not touch cart for unavailable GameStop offer',async()=>{
 const r=await probeGameStop(null,product,{status:'unavailable'});
 assert.equal(r.status,'skipped');
});
test('rejects shipping Not Available before trying cart',async()=>{
 const r=await probeGameStop(page('Ship to Home: Not Available'),product,{status:'candidate-needs-fulfillment-verification'});
 assert.equal(r.status,'shipping-unavailable-pickup-unverified');
});
test('cannot infer purchase availability from product page alone',async()=>{
 const r=await probeGameStop(page('PlayStation 5 New, Ship to Home'),product,{status:'candidate-needs-fulfillment-verification'});
 assert.equal(r.status,'cart-not-orderable');
});
test('does not attempt on other retailers',async()=>{
 const r=await probeGameStop(null,{retailer:'Amazon'},{status:'candidate-needs-fulfillment-verification'});
 assert.equal(r.status,'not-applicable');
});

test('both shipping and pickup explicitly unavailable establish full unavailability',async()=>{
 const r=await probeGameStop(page('Ship to Home: Not Available. Pick up in-store: Not Available.'),product,{status:'candidate-needs-fulfillment-verification'});
 assert.equal(r.status,'all-fulfillment-unavailable');
});
test('generic Not Available elsewhere is not proof shipping or pickup failed',async()=>{
 const r=await probeGameStop(page('Extended warranty: Not Available. Ship to Home. Find a Store.'),product,{status:'candidate-needs-fulfillment-verification'});
 assert.equal(r.status,'cart-not-orderable');
});

test('same-day unavailable is not proof ship-to-home is unavailable',async()=>{
 const r=await probeGameStop(page('Same Day Delivery: Not Available. Pick up in-store: Not Available. Ship to Home: Available.'),product,{status:'candidate-needs-fulfillment-verification'});
 assert.equal(r.status,'cart-not-orderable');
});

test('captures only bounded fulfillment text, not entire page',()=>{
 const text='Welcome to GameStop\nShip to Home\nNot Available\nFind a Store\nPick up in-store\nFind a Store\nFooter';
 const quotes=fulfillmentEvidence(text);
 assert.equal(quotes.length,2);
 assert.match(quotes[0],/Ship to Home/);
 assert.ok(quotes.every(x=>x.length<=220));
});

test('guest cart research never becomes purchase verification',async()=>{
 let stage=0;
 const mock={
  title:async()=> 'Sony PlayStation 5 Slim',
  locator:(selector)=>selector==='body'?{innerText:async()=>stage===0?'PlayStation 5 New. Ship to Home.':'Added to Cart. PS5 Disc Console. $449.99. Shipping to Phoenix 85001'}:{count:async()=>0},
  getByRole:(role)=>({first:()=>role==='button'
    ?{isVisible:async()=>true,isEnabled:async()=>true,click:async()=>{stage=1;}}
    :{isVisible:async()=>false}}),
  waitForTimeout:async()=>{},
  goto:async()=>{stage=2;},
  url:()=> 'https://www.gamestop.com/cart/'
 };
 const r=await probeGameStop(mock,product,{status:'candidate-needs-fulfillment-verification'});
 assert.equal(r.status,'cart-inspected-unverified');
 assert.equal(r.verifiedPurchase,false);
 assert.equal(r.cartEvidence.phoenixZipVisible,true);
 assert.equal(r.cartEvidence.productMentioned,true);
});

test('disabled cart researches store finder but cannot claim Phoenix pickup',async()=>{
 let searched=false;
 const mock={
  title:async()=> 'Sony PlayStation 5 Slim',
  locator:selector=>selector==='body'
    ?{innerText:async()=> 'PS5 Slim New\nShip to Home\nFind a Store\nPhoenix 85001\nPickup available'}
    :{count:async()=>0,first:()=>({isVisible:async()=>true,fill:async()=>{searched=true;},press:async()=>{}})},
  getByRole:(role,opts)=>({first:()=>({
    isVisible:async()=> role==='button' && /find a store/i.test(String(opts?.name)),
    isEnabled:async()=>false,
    click:async()=>{}
  })}),
  waitForTimeout:async()=>{}
 };
 const r=await probeGameStop(mock,product,{status:'candidate-needs-fulfillment-verification'});
 assert.equal(r.status,'cart-not-orderable');
 assert.equal(r.verifiedPurchase,false);
 assert.equal(searched,true);
 assert.equal(r.pickupResearch.verifiedPickup,false);
});
