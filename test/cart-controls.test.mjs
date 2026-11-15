import test from 'node:test';
import assert from 'node:assert/strict';
import {assessCartControls,captureCartControls} from '../src/checkout/cart-controls.mjs';
const expected={sku:'422135',productName:'Sony PlayStation 5 Slim Disc'};
const observation={
 rows:[{text:'Sony PlayStation 5 Slim Disc SKU 422135 Condition: New $449.00'}],
 fulfillmentOptions:[{selected:true,text:'Ship to Home — Phoenix 85001'}],
 checkoutControl:{enabled:true}
};
test('even complete fictional cart controls never assert verified checkout',()=>{
 const r=assessCartControls(observation,expected);
 assert.equal(r.status,'research-fields-observed-needs-live-review');
 assert.equal(r.verifiedPurchase,false);
});
test('wrong cart SKU is not a selected item match',()=>{
 const r=assessCartControls({...observation,rows:[{text:'Sony PlayStation 5 Slim Disc SKU 999999 Condition: New $449.00'}]},expected);
 assert.equal(r.status,'incomplete-cart-controls');
 assert.ok(r.missing.some(x=>x.includes('console cart row')));
});
test('two matching cart rows are ambiguous',()=>{
 const r=assessCartControls({...observation,rows:[...observation.rows,...observation.rows]},expected);
 assert.equal(r.status,'incomplete-cart-controls');
});
test('a shipping ZIP elsewhere on the page is not enough',()=>{
 const r=assessCartControls({...observation,fulfillmentOptions:[{selected:true,text:'Ship to Home — California 95123'},{selected:false,text:'Phoenix 85001'}]},expected);
 assert.ok(r.missing.some(x=>x.includes('Phoenix')));
});
test('unselected shipping option cannot prove orderability',()=>{
 const r=assessCartControls({...observation,fulfillmentOptions:[{selected:false,text:'Ship to Home — Phoenix 85001'}]},expected);
 assert.equal(r.status,'incomplete-cart-controls');
});
test('disabled checkout cannot prove orderability',()=>{
 const r=assessCartControls({...observation,checkoutControl:{enabled:false}},expected);
 assert.ok(r.missing.some(x=>x.includes('checkout')));
});
test('pre-owned console in cart cannot qualify',()=>{
 const r=assessCartControls({...observation,rows:[{text:'Sony PS5 Slim Disc SKU 422135 Pre-Owned $449.00'}]},expected);
 assert.ok(r.missing.some(x=>x.includes('NEW')));
});
test('cart DOM inspection errors remain research-only',async()=>{
 const r=await captureCartControls({evaluate:async()=>{throw new Error('blocked')}},expected);
 assert.equal(r.status,'cart-dom-unreadable');
 assert.equal(r.verifiedPurchase,false);
});
test('captured DOM controls are not upgraded to verified checkout',async()=>{
 const r=await captureCartControls({evaluate:async()=>observation},expected);
 assert.equal(r.status,'research-fields-observed-needs-live-review');
 assert.equal(r.verifiedPurchase,false);
});
