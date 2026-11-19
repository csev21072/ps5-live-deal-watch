import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sonyResearchMode} from '../src/research-mode.mjs';
import {probeSonyCart} from '../src/probes/playstation-direct-cart.mjs';
import {evaluate} from '../src/rules.mjs';
import {fictionalOffer} from './fixtures/fictional-offer.mjs';
const product={retailer:'PlayStation Direct',kind:'disc',url:'https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb'};
const facts={officialProductPage:true,status:'product-facts-observed-checkout-unverified',slimModelHint:true,editionHint:'disc',productHeading:'PlayStation 5 Console - 1 TB'};
const widget=priceText=>({status:'retailer-price-widget-observed',priceText});
test('research cannot be activated on scheduled, push or local runs',()=>{
 for(const event of ['schedule','push',undefined])assert.throws(()=>sonyResearchMode({GITHUB_EVENT_NAME:event,PS5_SONY_CART_RESEARCH:'disc'}),/manual/);
 assert.equal(sonyResearchMode({GITHUB_EVENT_NAME:'schedule'}),null);
});
test('manual research requires an explicit valid edition',()=>{
 assert.equal(sonyResearchMode({GITHUB_EVENT_NAME:'workflow_dispatch'}),null);
 for(const edition of ['disc','digital'])assert.equal(sonyResearchMode({GITHUB_EVENT_NAME:'workflow_dispatch',PS5_SONY_CART_RESEARCH:edition}),edition);
 assert.throws(()=>sonyResearchMode({GITHUB_EVENT_NAME:'workflow_dispatch',PS5_SONY_CART_RESEARCH:'all'}));
});
test('manual research reaches above-target guest cart but cannot verify a purchase',async()=>{
 let stage=0,clicks=0;
 const page={
  getByRole:role=>({count:async()=>1,first:()=>role==='button'?{
   isVisible:async()=>true,isEnabled:async()=>true,click:async()=>{clicks++;stage=1;}
  }:{isVisible:async()=>false}}),
  waitForTimeout:async()=>{},goto:async()=>{stage=2;},
  url:()=> 'https://direct.playstation.com/en-us/cart',
  locator:()=>({innerText:async()=>stage===1?'Added to Cart. View Cart.':'Shopping Cart\nPlayStation 5 Console - 1 TB\n$649.00'}),
  evaluate:async()=>({rows:[],fulfillmentOptions:[],checkoutControl:{enabled:false}})
 };
 const result=await probeSonyCart(page,product,facts,'$649.00',widget('$649.00'),{researchOnly:true});
 assert.equal(clicks,1);assert.equal(result.status,'cart-inspected-unverified');
 assert.equal(result.verifiedPurchase,false);assert.equal(result.checkoutVerified,false);
 assert.equal(result.cartResearch.domControls.status,'incomplete-cart-controls');
});
test('research preserves model, price evidence, ceiling and disabled-button gates',async()=>{
 const options={researchOnly:true};
 assert.equal((await probeSonyCart(null,product,facts,'$801.00',widget('$801.00'),options)).status,'research-price-above-ceiling');
 assert.equal((await probeSonyCart(null,product,facts,'$649.00',null,options)).status,'retailer-price-widget-unverified');
 assert.equal((await probeSonyCart(null,product,{...facts,slimModelHint:false},'$649.00',widget('$649.00'),options)).status,'product-facts-incomplete');
 const page={getByRole:()=>({count:async()=>1,first:()=>({isVisible:async()=>true,isEnabled:async()=>false,click:async()=>{throw new Error('must not click');}})})};
 assert.equal((await probeSonyCart(page,product,facts,'$649.00',widget('$649.00'),options)).status,'cart-button-unavailable');
});
test('even a complete below-target fixture cannot alert during research',()=>{
 const now=Date.now();
 assert.equal(evaluate(fictionalOffer(now),now).qualifies,true);
 const r=evaluate(fictionalOffer(now,{researchOnly:true}),now);
 assert.equal(r.qualifies,false);assert.ok(r.reasons.includes('manual cart research cannot generate a deal alert'));
});
test('manual research workflow disables the actual GitHub publisher',async()=>{
 const source=await readFile(new URL('../.github/workflows/scan.yml',import.meta.url),'utf8');
 assert.match(source,/default: none/);
 assert.match(source,/name: Open GitHub issue ONLY for fully verified deals\s+if: inputs.sony_cart_research == '' \|\| inputs.sony_cart_research == 'none'/);
});
