import test from 'node:test';
import assert from 'node:assert/strict';
import {probeSonyCart} from '../src/probes/playstation-direct-cart.mjs';
const product={id:'psdirect-disc',retailer:'PlayStation Direct',kind:'disc',url:'https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb'};
const facts={officialProductPage:true,status:'product-facts-observed-checkout-unverified',slimModelHint:true,editionHint:'disc',productHeading:'PlayStation 5 Console - 1 TB'};
test('does not attempt a cart when price is unknown',async()=>{
 const r=await probeSonyCart(null,product,facts,'');
 assert.equal(r.status,'price-not-readable');assert.equal(r.verifiedPurchase,false);
});
test('does not attempt cart above $500 disc threshold',async()=>{
 const r=await probeSonyCart(null,product,facts,'$649.00');
 assert.equal(r.status,'price-above-target');
});
test('does not attempt cart when model or edition is not verified',async()=>{
 const r=await probeSonyCart(null,product,{...facts,slimModelHint:false},'$449.00');
 assert.equal(r.status,'product-facts-incomplete');
});
test('refurbished/excluded Sony page cannot be probed',async()=>{
 const r=await probeSonyCart(null,product,{...facts,status:'excluded-model'},'$399.00');
 assert.equal(r.status,'product-facts-incomplete');
});
test('ambiguous Add to Cart buttons never clicked',async()=>{
 let clicks=0;
 const page={getByRole:()=>({count:async()=>2,first:()=>({click:async()=>{clicks++;}})})};
 const r=await probeSonyCart(page,product,facts,'$449.00');
 assert.equal(r.status,'cart-button-not-unique');assert.equal(clicks,0);
});
test('disabled Sony Add to Cart never clicked',async()=>{
 let clicks=0;
 const page={getByRole:()=>({count:async()=>1,first:()=>({isVisible:async()=>true,isEnabled:async()=>false,click:async()=>{clicks++;}})})};
 const r=await probeSonyCart(page,product,facts,'$449.00');
 assert.equal(r.status,'cart-button-unavailable');assert.equal(clicks,0);
});
test('observed Sony cart is research only, not verified checkout',async()=>{
 let stage=0;
 const page={
  getByRole:(role)=>({count:async()=>1,first:()=>role==='button'?{
   isVisible:async()=>true,isEnabled:async()=>true,click:async()=>{stage=1;}
  }:{isVisible:async()=>false}}),
  waitForTimeout:async()=>{},
  goto:async()=>{stage=2;},
  url:()=> 'https://direct.playstation.com/en-us/cart',
  locator:()=>({innerText:async()=>stage===1?'Added to Cart. View Cart.': 'Shopping Cart\nPlayStation 5 Console - 1 TB\n$449.00\nShipping to Phoenix 85001'})
 };
 const r=await probeSonyCart(page,product,facts,'$449.00');
 assert.equal(r.status,'cart-inspected-unverified');
 assert.equal(r.verifiedPurchase,false);
 assert.equal(r.checkoutVerified,false);
 assert.equal(r.cartResearch.itemMatch.verifiedCheckout,false);
});
test('Sony Digital has independent $450 threshold',async()=>{
 const r=await probeSonyCart(null,{...product,kind:'digital'},{...facts,editionHint:'digital'},'$459.00');
 assert.equal(r.status,'price-above-target');
});
