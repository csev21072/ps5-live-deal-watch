import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,priceFromText} from '../src/rules.mjs';
const now=Date.now();
function base(){return {url:'https://www.gamestop.com/ps5',host:'www.gamestop.com',retailer:'GameStop',kind:'disc',source:'live-retailer-purchase-surface',checkedAt:new Date(now).toISOString(),exactModel:'Sony PS5 Slim Disc 1TB',skuOrBundle:'SKU-123',condition:'NEW',conditionText:'Condition: New',seller:'GameStop',sellerText:'Sold by GameStop',shipper:'GameStop',shipperText:'Shipped by GameStop',controllers:1,storage:'1TB',discDrive:true,price:499,priceText:'$499.00',fulfillment:{confirmed:true,method:'ship-to-home',zip:'85001',text:'Ship to home, arrives November 20, available for this item',locationText:'Shipping to Phoenix 85001',cartOrCheckoutConfirmed:true},checkoutEvidence:{url:'https://www.gamestop.com/cart',observedAt:new Date(now).toISOString(),skuOrBundle:'SKU-123',priceText:'$499.00',zip:'85001',fulfillmentText:'Shipping to Phoenix 85001, orderable',orderable:true},gameCredit:0};}
test('parses prices without confusing comma',()=>assert.equal(priceFromText('$1,234.56'),1234.56));
test('valid current retailer checkout qualifies',()=>assert.equal(evaluate(base(),now).qualifies,true));
test('unavailable fulfillment never qualifies',()=>{const x=base();x.fulfillment.text='Ship to Home: Not Available';assert.equal(evaluate(x,now).qualifies,false);});
test('Add to Cart alone never qualifies',()=>{const x=base();x.fulfillment.cartOrCheckoutConfirmed=false;assert.equal(evaluate(x,now).qualifies,false);});
test('wrong zip never qualifies',()=>{const x=base();x.fulfillment.zip='95123';assert.equal(evaluate(x,now).qualifies,false);});
test('stale evidence never qualifies',()=>{const x=base();x.checkedAt=new Date(now-11*60_000).toISOString();assert.equal(evaluate(x,now).qualifies,false);});
test('price over target rejected',()=>{const x=base();x.price=501;x.priceText='$501.00';assert.equal(evaluate(x,now).qualifies,false);});
test('two controller bundle effective price credits $55',()=>{const x=base();x.controllers=2;x.extraControllerEvidence='Extra genuine Sony DualSense Wireless Controller';x.price=550;x.priceText='$550.00';x.checkoutEvidence.priceText='$550.00';const r=evaluate(x,now);assert.equal(r.effectivePrice,495);assert.equal(r.qualifies,true);});
test('unsupported game credit rejected',()=>{const x=base();x.price=540;x.priceText='$540.00';x.gameCredit=50;assert.equal(evaluate(x,now).qualifies,false);});
test('marketplace seller missing shipper proof rejected',()=>{const x=base();x.retailer='Amazon';x.host='www.amazon.com';x.url='https://www.amazon.com/dp/B0EXAMPLE1';x.checkoutEvidence.url='https://www.amazon.com/cart';x.shipperText='';assert.equal(evaluate(x,now).qualifies,false);});
test('CAPTCHA rejected',()=>{const x=base();x.blocked=true;assert.equal(evaluate(x,now).qualifies,false);});
test('digital target enforced',()=>{const x=base();x.kind='digital';x.discDrive=false;assert.equal(evaluate(x,now).qualifies,false);});
test('conflicting evidence rejected',()=>{const x=base();x.conflictingEvidence=true;assert.equal(evaluate(x,now).qualifies,false);});

test('multiple prices in a price label are ambiguous',()=>assert.equal(priceFromText('$449.99 - $649.00'),null));
test('retailer unavailable flag always rejects',()=>{const x=base();x.unavailable=true;assert.equal(evaluate(x,now).qualifies,false);});
test('used condition with NEW token always rejects',()=>{const x=base();x.conditionText='Not new / used';assert.equal(evaluate(x,now).qualifies,false);});
test('two controller credit requires actual DualSense evidence',()=>{const x=base();x.controllers=2;x.price=550;x.priceText='$550.00';assert.equal(evaluate(x,now).qualifies,false);});
test('fulfillment location text must confirm Phoenix ZIP',()=>{const x=base();x.fulfillment.locationText='Shipping to San Jose';assert.equal(evaluate(x,now).qualifies,false);});

test('missing cart evidence rejects even with Add to Cart',()=>{const x=base();delete x.checkoutEvidence;assert.equal(evaluate(x,now).qualifies,false);});
test('mismatched cart price rejects',()=>{const x=base();x.checkoutEvidence.priceText='$498.00';assert.equal(evaluate(x,now).qualifies,false);});
test('mismatched cart SKU rejects',()=>{const x=base();x.checkoutEvidence.skuOrBundle='OTHER';assert.equal(evaluate(x,now).qualifies,false);});
test('wrong cart ZIP rejects',()=>{const x=base();x.checkoutEvidence.zip='95123';assert.equal(evaluate(x,now).qualifies,false);});
test('stale cart evidence rejects',()=>{const x=base();x.checkoutEvidence.observedAt=new Date(now-11*60_000).toISOString();assert.equal(evaluate(x,now).qualifies,false);});
test('cart URL on another domain rejects',()=>{const x=base();x.checkoutEvidence.url='https://other.example.com/cart';assert.equal(evaluate(x,now).qualifies,false);});
test('product URL pretending to be cart rejects',()=>{const x=base();x.checkoutEvidence.url='https://www.example.com/ps5';assert.equal(evaluate(x,now).qualifies,false);});
test('checkout unavailable text rejects',()=>{const x=base();x.checkoutEvidence.fulfillmentText='Ship to Home Not Available in Phoenix 85001';assert.equal(evaluate(x,now).qualifies,false);});

test('PS5 Pro cannot masquerade as Slim',()=>{const x=base();x.exactModel='Sony PS5 Pro Disc Slim';assert.equal(evaluate(x,now).qualifies,false);});
test('unverified non-Slim product title rejected',()=>{const x=base();x.exactModel='PlayStation 5 Disc Console';assert.equal(evaluate(x,now).qualifies,false);});
test('verified model evidence can establish Slim without title keyword',()=>{const x=base();x.exactModel='PlayStation 5 Disc Console';x.slimModelEvidence=true;assert.equal(evaluate(x,now).qualifies,true);});
test('Amazon first-party sold and shipped can pass with otherwise complete evidence',()=>{const x=base();x.retailer='Amazon';x.host='www.amazon.com';x.url='https://www.amazon.com/dp/B0EXAMPLE1';x.checkoutEvidence.url='https://www.amazon.com/cart';x.seller='Amazon.com';x.shipper='Amazon.com';x.sellerText='Sold by Amazon.com';x.shipperText='Ships from Amazon.com';assert.equal(evaluate(x,now).qualifies,true);});
test('Amazon third-party offer requires independent approval and reputation',()=>{const x=base();x.retailer='Amazon';x.host='www.amazon.com';x.url='https://www.amazon.com/dp/B0EXAMPLE1';x.checkoutEvidence.url='https://www.amazon.com/cart';x.seller='Unknown Merchant';x.shipper='Unknown Merchant';assert.equal(evaluate(x,now).qualifies,false);});
test('marketplace seller reputation text alone is not enough',()=>{const x=base();x.retailer='Walmart';x.host='www.walmart.com';x.url='https://www.walmart.com/ip/123456';x.checkoutEvidence.url='https://www.walmart.com/cart';x.seller='Unknown Merchant';x.shipper='Unknown Merchant';x.marketplaceReputationEvidence='5 stars';assert.equal(evaluate(x,now).qualifies,false);});

test('seller identity must appear in retailer-owned seller text',()=>{const x=base();x.seller='Example';x.sellerText='Sold by Different Merchant';assert.equal(evaluate(x,now).qualifies,false);});
test('shipper identity must appear in retailer-owned shipper text',()=>{const x=base();x.shipper='Example';x.shipperText='Shipped by Different Merchant';assert.equal(evaluate(x,now).qualifies,false);});
test('first-party claim cannot override contradictory seller text',()=>{const x=base();x.retailer='Amazon';x.host='www.amazon.com';x.url='https://www.amazon.com/dp/B0EXAMPLE1';x.checkoutEvidence.url='https://www.amazon.com/cart';x.seller='Amazon.com';x.shipper='Amazon.com';x.sellerText='Sold by Third Party';x.shipperText='Ships from Amazon.com';assert.equal(evaluate(x,now).qualifies,false);});

test('string game value assertion cannot justify bundle discount',()=>{const x=base();x.price=530;x.priceText='$530.00';x.checkoutEvidence.priceText='$530.00';x.gameCredit=35;x.gameCreditEvidence='Game MSRP $70';assert.equal(evaluate(x,now).qualifies,false);});
test('contemporaneous verified game sale supports conservative credit',()=>{const x=base();x.price=530;x.priceText='$530.00';x.checkoutEvidence.priceText='$530.00';x.gameCredit=35;x.gameCreditEvidence={currentSalePrice:39,observedAt:new Date(now).toISOString(),sourceUrl:'https://www.example.com/game-sale',saleType:'current-retail-sale'};assert.equal(evaluate(x,now).qualifies,true);});
test('game MSRP-sized $50 credit rejected even with sale evidence',()=>{const x=base();x.price=540;x.priceText='$540.00';x.checkoutEvidence.priceText='$540.00';x.gameCredit=50;x.gameCreditEvidence={currentSalePrice:70,observedAt:new Date(now).toISOString(),sourceUrl:'https://www.example.com/game-sale',saleType:'current-retail-sale'};assert.equal(evaluate(x,now).qualifies,false);});
test('stale game sale cannot justify bundle discount',()=>{const x=base();x.price=530;x.priceText='$530.00';x.checkoutEvidence.priceText='$530.00';x.gameCredit=35;x.gameCreditEvidence={currentSalePrice:39,observedAt:new Date(now-8*24*60*60*1000).toISOString(),sourceUrl:'https://www.example.com/game-sale',saleType:'current-retail-sale'};assert.equal(evaluate(x,now).qualifies,false);});
test('generic DualSense mention does not establish second genuine controller',()=>{const x=base();x.controllers=2;x.price=550;x.priceText='$550.00';x.checkoutEvidence.priceText='$550.00';x.extraControllerEvidence='Includes DualSense controller';assert.equal(evaluate(x,now).qualifies,false);});

test('implausible multi-controller count cannot manufacture an effective discount',()=>{
 const x=base();x.controllers=100;x.extraControllerEvidence='2 extra genuine Sony DualSense controllers';
 x.price=999;x.priceText='$999.00';x.checkoutEvidence.priceText='$999.00';
 const v=evaluate(x,now);
 assert.equal(v.qualifies,false);
 assert.equal(v.extraControllerCredit,0);
});
test('three controllers require manual valuation instead of automatic $110 credit',()=>{
 const x=base();x.controllers=3;x.extraControllerEvidence='2 extra genuine Sony DualSense controllers';
 x.price=550;x.priceText='$550.00';x.checkoutEvidence.priceText='$550.00';
 const v=evaluate(x,now);
 assert.equal(v.qualifies,false);
 assert.equal(v.extraControllerCredit,0);
});

test('unknown retailer-owned-looking host never qualifies',()=>{
 const x=base();x.retailer='Example';x.host='www.example.com';x.url='https://www.example.com/ps5';x.checkoutEvidence.url='https://www.example.com/cart';
 assert.equal(evaluate(x,now).qualifies,false);
});
test('GameStop record cannot use a lookalike retailer hostname',()=>{
 const x=base();x.host='deals.gamestop.com';x.url='https://deals.gamestop.com/ps5';x.checkoutEvidence.url='https://deals.gamestop.com/cart';
 assert.equal(evaluate(x,now).qualifies,false);
});
test('retailer mismatch fails even if both domains are valid stores',()=>{
 const x=base();x.retailer='Amazon';assert.equal(evaluate(x,now).qualifies,false);
});
