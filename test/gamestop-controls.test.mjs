import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyPurchaseControls,inspectGameStopControls,selectExplicitNewCondition} from '../src/probes/gamestop-controls.mjs';
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

test('does not click any condition when NEW is already selected',async()=>{
 const controls=classifyPurchaseControls({controls:[cart,{label:'New',selected:true}]});
 const result=await selectExplicitNewCondition({getByRole:()=>{throw Error('must not click')}},controls);
 assert.equal(result.status,'already-selected');
});
test('ambiguous multiple NEW radio choices never clicked',async()=>{
 let clicks=0;
 const page={getByRole:()=>({count:async()=>2,first:()=>({click:async()=>{clicks++;}})})};
 const r=await selectExplicitNewCondition(page,{newConditionSelected:false});
 assert.equal(r.status,'no-unambiguous-new-option');
 assert.equal(clicks,0);
});
test('unique NEW radio is selected then re-inspected',async()=>{
 let clicked=false;
 const page={
  getByRole:role=>({count:async()=>role==='radio'?1:0,first:()=>({isVisible:async()=>true,isEnabled:async()=>true,click:async()=>{clicked=true;}})}),
  waitForTimeout:async()=>{},
  evaluate:async()=>({controls:[cart,{label:'New',disabled:false,selected:clicked}]})
 };
 const r=await selectExplicitNewCondition(page,{newConditionSelected:false});
 assert.equal(r.status,'selected-new');
 assert.equal(r.controls.newConditionSelected,true);
});
test('button named NEW without condition context is not clicked',async()=>{
 let clicks=0;
 const page={getByRole:role=>({
  count:async()=>role==='button'?1:0,
  first:()=>({isVisible:async()=>true,isEnabled:async()=>true,evaluate:async()=>false,click:async()=>{clicks++;}})
 })};
 const r=await selectExplicitNewCondition(page,{newConditionSelected:false});
 assert.equal(r.status,'no-unambiguous-new-option');
 assert.equal(clicks,0);
});
test('NEW radio click without selected-state confirmation cannot enable cart',async()=>{
 const page={
  getByRole:role=>({count:async()=>role==='radio'?1:0,first:()=>({isVisible:async()=>true,isEnabled:async()=>true,click:async()=>{}})}),
  waitForTimeout:async()=>{},
  evaluate:async()=>({controls:[cart,{label:'New',selected:false}]})
 };
 const r=await selectExplicitNewCondition(page,{newConditionSelected:false});
 assert.equal(r.status,'selection-not-confirmed');
 assert.equal(r.controls.newConditionSelected,false);
});
