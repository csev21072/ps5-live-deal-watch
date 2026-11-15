import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPickupFinder} from '../src/probes/gamestop-pickup.mjs';
test('no store finder never implies pickup availability',async()=>{
 const page={getByRole:()=>({first:()=>({isVisible:async()=>false})})};
 const r=await inspectPickupFinder(page);
 assert.equal(r.status,'finder-not-exposed');
 assert.equal(r.verifiedPickup,false);
});
test('store finder results are only research, never reservation',async()=>{
 let clicked=false,filled='';
 const trigger={isVisible:async()=>true,click:async()=>{clicked=true;}};
 const field={isVisible:async()=>true,fill:async x=>{filled=x;},press:async()=>{}};
 const page={
   getByRole:()=>({first:()=>trigger}),
   locator:selector=>selector==='body'?{innerText:async()=> 'Search stores\nPhoenix AZ 85001\nStore Pickup\nIn Stock'}:{first:()=>field},
   waitForTimeout:async()=>{}
 };
 const r=await inspectPickupFinder(page);
 assert.equal(clicked,true);assert.equal(filled,'85001');
 assert.equal(r.status,'store-list-observed-not-reservable');
 assert.equal(r.verifiedPickup,false);
 assert.equal(r.zipObserved,true);
});
test('CAPTCHA in store finder fails closed',async()=>{
 const trigger={isVisible:async()=>true,click:async()=>{}};
 const field={isVisible:async()=>true,fill:async()=>{},press:async()=>{}};
 const page={
   getByRole:()=>({first:()=>trigger}),
   locator:selector=>selector==='body'?{innerText:async()=> 'Verify you are human CAPTCHA'}:{first:()=>field},
   waitForTimeout:async()=>{}
 };
 const r=await inspectPickupFinder(page);
 assert.equal(r.status,'blocked');
 assert.equal(r.verifiedPickup,false);
});
