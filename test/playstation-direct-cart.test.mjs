import test from 'node:test';
import assert from 'node:assert/strict';
import {sonyPage} from './fixtures/sony-page.mjs';
import {probeSonyCart as runProbe} from '../src/probes/playstation-direct-cart.mjs';
const probe=(page,product,facts,priceText)=>runProbe(page,product,facts,priceText,{status:'retailer-price-widget-observed',priceText});
const product={id:'psdirect-disc',retailer:'PlayStation Direct',kind:'disc',url:'https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb'};
const facts={officialProductPage:true,status:'product-facts-observed-checkout-unverified',slimModelHint:true,editionHint:'disc',productHeading:'PlayStation 5 Console - 1 TB'};
test('does not attempt a cart when price is unknown',async()=>{
 const r=await probe(null,product,facts,'');
 assert.equal(r.status,'price-not-readable');assert.equal(r.verifiedPurchase,false);
});
test('does not attempt cart above $500 disc threshold',async()=>{
 const r=await probe(null,product,facts,'$649.00');
 assert.equal(r.status,'price-above-target');
});
test('does not attempt cart when model or edition is not verified',async()=>{
 const r=await probe(null,product,{...facts,slimModelHint:false},'$449.00');
 assert.equal(r.status,'product-facts-incomplete');
});
test('refurbished/excluded Sony page cannot be probed',async()=>{
 const r=await probe(null,product,{...facts,status:'excluded-model'},'$399.00');
 assert.equal(r.status,'product-facts-incomplete');
});
test('ambiguous console Add to Cart buttons never clicked',async()=>{
 const {page,calls}=sonyPage({buttons:2});
 assert.equal((await probe(page,product,facts,'$449.00')).status,'cart-button-not-unique');
 assert.equal(calls.clicks,0);
});
test('disabled Sony Add to Cart never clicked',async()=>{
 const {page,calls}=sonyPage({enabled:false});
 assert.equal((await probe(page,product,facts,'$449.00')).status,'cart-button-unavailable');
 assert.equal(calls.clicks,0);
});
test('observed Sony cart is research only, not verified checkout',async()=>{
 const {page,calls}=sonyPage();
 const r=await probe(page,product,facts,'$449.00');
 assert.equal(r.status,'cart-inspected-unverified');
 assert.equal(calls.clicks,1);assert.deepEqual(calls.urls,['https://direct.playstation.com/en-us/checkout?tab=cart']);
 assert.equal(r.verifiedPurchase,false);assert.equal(r.checkoutVerified,false);
 assert.equal(r.cartResearch.itemMatch.verifiedCheckout,false);
});
test('Sony Digital has independent $450 threshold',async()=>{
 const r=await probe(null,{...product,kind:'digital'},{...facts,editionHint:'digital'},'$459.00');
 assert.equal(r.status,'price-above-target');
});

test('Sony cart is not touched without independently observed price widget',async()=>{
 const r=await runProbe(null,product,facts,'$449.00',null);
 assert.equal(r.status,'retailer-price-widget-unverified');
});
test('Sony cart is not touched when price widget conflicts with selected price',async()=>{
 const r=await runProbe(null,product,facts,'$449.00',{status:'retailer-price-widget-observed',priceText:'$399.00'});
 assert.equal(r.status,'retailer-price-widget-unverified');
});


test('missing or duplicate console hero prevents clicks on recommendations',async()=>{
 for(const heroes of [0,2]){const {page,calls}=sonyPage({heroes});
 assert.equal((await probe(page,product,facts,'$449.00')).status,'product-hero-not-unique');assert.equal(calls.clicks,0);}
});
test('missing console SKU prevents cart mutation',async()=>{
 const {page,calls}=sonyPage({sku:'unknown'});
 assert.equal((await probe(page,product,facts,'$449.00')).status,'product-sku-unreadable');assert.equal(calls.clicks,0);
});
test('cart navigation cannot reach payment, shipping, or another host',async()=>{
 for(const href of ['/en-us/checkout?tab=payment','/en-us/checkout?tab=shipping','https://example.org/en-us/checkout?tab=cart','/en-us/checkout?tab=cart&token=secret']){
 const {page,calls}=sonyPage({href});assert.equal((await probe(page,product,facts,'$449.00')).status,'cart-review-url-unexpected');assert.equal(calls.urls.length,0);}
});
test('CAPTCHA or unconfirmed cart never advances',async()=>{
 for(const options of [{blocked:true},{confirmed:false}]){const {page,calls}=sonyPage(options);
 const r=await probe(page,product,facts,'$449.00');assert.ok(['blocked-after-cart','cart-add-unconfirmed'].includes(r.status));assert.equal(calls.urls.length,0);}
});
