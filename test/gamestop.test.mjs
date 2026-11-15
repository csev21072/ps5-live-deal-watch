import test from 'node:test';
import assert from 'node:assert/strict';
import {probeGameStop} from '../src/probes/gamestop.mjs';
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
