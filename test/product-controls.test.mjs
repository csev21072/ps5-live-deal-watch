import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyProductControls,inspectProductControls} from '../src/probes/product-controls.mjs';
const product={id:'target-disc',retailer:'Target',kind:'disc'};
const controls=[{label:'Add to cart',disabled:false,selected:false},{label:'New',disabled:false,selected:true}];
test('enabled product Add to Cart is diagnostic, not a verified checkout',()=>{
 const r=classifyProductControls({controls,editionHint:'disc'},product);
 assert.equal(r.status,'cart-action-enabled-unverified');
 assert.equal(r.newConditionSelected,true);
 assert.equal(r.verifiedPurchase,false);
 assert.equal(r.checkoutVerified,false);
});
test('wrong product edition cannot produce positive research status',()=>{
 const r=classifyProductControls({controls,editionHint:'digital'},product);
 assert.equal(r.status,'edition-not-confirmed');
 assert.equal(r.verifiedPurchase,false);
});
test('disabled and sold-out controls remain unverified',()=>{
 const r=classifyProductControls({controls:[{label:'Add to cart',disabled:true},{label:'Buy Now — Out of Stock',disabled:false}],editionHint:'disc'},product);
 assert.equal(r.status,'cart-action-disabled');
 assert.equal(r.enabledCartActions,0);
});
test('global cart navigation is not product purchase evidence',()=>{
 const r=classifyProductControls({controls:[{label:'View Cart',disabled:false}],editionHint:'disc'},product);
 assert.equal(r.status,'cart-action-not-found');
});
test('no visible selected NEW control does not infer NEW condition',()=>{
 const r=classifyProductControls({controls:[{label:'Add to cart',disabled:false},{label:'New',selected:false}],editionHint:'disc'},product);
 assert.equal(r.newConditionSelected,false);
});
test('selected pre-owned control never counts as NEW',()=>{
 const r=classifyProductControls({controls:[{label:'Add to cart',disabled:false},{label:'Pre-Owned',selected:true}],editionHint:'disc'},product);
 assert.equal(r.newConditionSelected,false);
});
test('raw labels with personal data never reach public diagnostics',()=>{
 const r=classifyProductControls({controls:[{label:'Add to cart — Jane Example jane@example.org',disabled:false}],editionHint:'disc'},product);
 assert.equal(r.enabledCartActions,1);
 assert.ok(!JSON.stringify(r).includes('Jane'));
 assert.ok(!JSON.stringify(r).includes('example.org'));
});
test('browser DOM failure fails closed without retailer requests',async()=>{
 const r=await inspectProductControls({evaluate:async()=>{throw Error('blocked')}},product,{editionHint:'disc'});
 assert.equal(r.status,'purchase-controls-unreadable');
 assert.equal(r.verifiedPurchase,false);
});
test('read-only DOM inspection returns research-only status',async()=>{
 const r=await inspectProductControls({evaluate:async()=>({controls})},product,{editionHint:'disc'});
 assert.equal(r.status,'cart-action-enabled-unverified');
 assert.equal(r.verifiedPurchase,false);
});

test('shipping and pickup buttons alone are not an Add to Cart action',()=>{
 const r=classifyProductControls({controls:[
  {label:'Pickup',disabled:false},{label:'Delivery',disabled:false},{label:'Shipping',disabled:false}
 ],editionHint:'disc'},product);
 assert.equal(r.status,'fulfillment-controls-only');
 assert.equal(r.cartActionCount,0);
 assert.equal(r.enabledCartActions,0);
 assert.equal(r.fulfillmentNavigationCount,3);
 assert.equal(r.verifiedPurchase,false);
});
