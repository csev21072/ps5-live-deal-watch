import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyPurchaseControls,inspectGameStopControls} from '../src/probes/gamestop-controls.mjs';
const cart={label:'Add to Cart',disabled:false,selected:false,reason:''};
test('NEW text alone does not establish selected condition',()=>{
 const r=classifyPurchaseControls({controls:[cart,{label:'New',disabled:false,selected:false}]});
 assert.equal(r.newConditionSelected,false);assert.equal(r.status,'condition-unverified');
});
test('selected NEW and enabled cart is a candidate, not checkout proof',()=>{
 const r=classifyPurchaseControls({controls:[cart,{label:'New',disabled:false,selected:true}]});
 assert.equal(r.newConditionSelected,true);
 assert.equal(r.status,'new-selected-cart-control-enabled');
 assert.equal(r.verifiedCheckout,false);
});
test('selected Pre-Owned overrides a NEW label',()=>{
 const r=classifyPurchaseControls({controls:[cart,{label:'New',selected:true},{label:'Pre-Owned',selected:true}]});
 assert.equal(r.newConditionSelected,false);
});
test('disabled cart never counts as actionable',()=>{
 const r=classifyPurchaseControls({controls:[{...cart,disabled:true,reason:'Select condition for availability'},{label:'New',selected:true}]});
 assert.equal(r.status,'cart-control-disabled');
 assert.equal(r.enabledCartControls,0);
});
test('no cart control is reported, not inferred from page title',()=>{
 const r=classifyPurchaseControls({controls:[{label:'New',selected:true}]});
 assert.equal(r.status,'cart-control-missing');
});
test('DOM inspection errors remain unverified',async()=>{
 const r=await inspectGameStopControls({evaluate:async()=>{throw Error('blocked')}});
 assert.equal(r.status,'control-inspection-failed');
 assert.equal(r.verifiedCheckout,false);
});
