import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,priceFromText} from '../src/rules.mjs';
const now=Date.now();
function base(){return {url:'https://www.example.com/ps5',host:'www.example.com',retailer:'Example',kind:'disc',source:'live-retailer-purchase-surface',checkedAt:new Date(now).toISOString(),exactModel:'Sony PS5 Slim Disc 1TB',skuOrBundle:'SKU-123',condition:'NEW',conditionText:'Condition: New',seller:'Example',sellerText:'Sold by Example',shipper:'Example',shipperText:'Shipped by Example',controllers:1,storage:'1TB',discDrive:true,price:499,priceText:'$499.00',fulfillment:{confirmed:true,method:'ship-to-home',zip:'85001',text:'Ship to home, arrives November 20, available for this item',locationText:'Shipping to Phoenix 85001',cartOrCheckoutConfirmed:true},gameCredit:0};}
test('parses prices without confusing comma',()=>assert.equal(priceFromText('$1,234.56'),1234.56));
test('valid current retailer checkout qualifies',()=>assert.equal(evaluate(base(),now).qualifies,true));
test('unavailable fulfillment never qualifies',()=>{const x=base();x.fulfillment.text='Ship to Home: Not Available';assert.equal(evaluate(x,now).qualifies,false);});
test('Add to Cart alone never qualifies',()=>{const x=base();x.fulfillment.cartOrCheckoutConfirmed=false;assert.equal(evaluate(x,now).qualifies,false);});
test('wrong zip never qualifies',()=>{const x=base();x.fulfillment.zip='95123';assert.equal(evaluate(x,now).qualifies,false);});
test('stale evidence never qualifies',()=>{const x=base();x.checkedAt=new Date(now-11*60_000).toISOString();assert.equal(evaluate(x,now).qualifies,false);});
test('price over target rejected',()=>{const x=base();x.price=501;x.priceText='$501.00';assert.equal(evaluate(x,now).qualifies,false);});
test('two controller bundle effective price credits $55',()=>{const x=base();x.controllers=2;x.price=550;x.priceText='$550.00';const r=evaluate(x,now);assert.equal(r.effectivePrice,495);assert.equal(r.qualifies,true);});
test('unsupported game credit rejected',()=>{const x=base();x.price=540;x.priceText='$540.00';x.gameCredit=50;assert.equal(evaluate(x,now).qualifies,false);});
test('marketplace seller missing shipper proof rejected',()=>{const x=base();x.retailer='Amazon';x.shipperText='';assert.equal(evaluate(x,now).qualifies,false);});
test('CAPTCHA rejected',()=>{const x=base();x.blocked=true;assert.equal(evaluate(x,now).qualifies,false);});
test('digital target enforced',()=>{const x=base();x.kind='digital';x.discDrive=false;assert.equal(evaluate(x,now).qualifies,false);});
test('conflicting evidence rejected',()=>{const x=base();x.conflictingEvidence=true;assert.equal(evaluate(x,now).qualifies,false);});
