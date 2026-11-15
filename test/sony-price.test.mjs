import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSonyPriceEvidence} from '../src/evidence/sony-price.mjs';
const widget={priceSelector:'[data-qa="product-price"]',priceText:'649',priceContext:'$ 649 . 00'};
test('official Sony widget with adjacent dollar price can be normalized',()=>{
 const r=parseSonyPriceEvidence(widget);
 assert.equal(r.price,649);
 assert.equal(r.priceText,'$649.00');
 assert.equal(r.status,'retailer-price-widget-observed');
});
test('Sony price widget without visible currency context stays unknown',()=>{
 const r=parseSonyPriceEvidence({...widget,priceContext:'649'});
 assert.equal(r.price,null);
});
test('price context for a different amount is rejected',()=>{
 const r=parseSonyPriceEvidence({...widget,priceContext:'$ 599 . 00'});
 assert.equal(r.price,null);
});
test('unknown price selector cannot establish retailer price',()=>{
 const r=parseSonyPriceEvidence({...widget,priceSelector:'.recommendation-price'});
 assert.equal(r.price,null);
});
test('explicit $ price from exact Sony widget is accepted',()=>{
 const r=parseSonyPriceEvidence({...widget,priceText:'$449.00',priceContext:''});
 assert.equal(r.price,449);
});
test('ambiguous multiple widget amounts are rejected',()=>{
 const r=parseSonyPriceEvidence({...widget,priceText:'649 599'});
 assert.equal(r.price,null);
});
test('unreasonably small accessory price is not a console price',()=>{
 const r=parseSonyPriceEvidence({...widget,priceText:'29',priceContext:'$ 29 . 00'});
 assert.equal(r.price,null);
});
test('widget does not prove fulfillment or stock',()=>{
 const r=parseSonyPriceEvidence(widget);
 assert.equal('fulfillment' in r,false);
 assert.equal('verifiedCheckout' in r,false);
});

test('integer widget cannot reinterpret $649.99 as $649.00',()=>{
 const r=parseSonyPriceEvidence({...widget,priceContext:'$649.99'});
 assert.equal(r.price,null);
});
test('fractional widget requires matching fractional currency context',()=>{
 const r=parseSonyPriceEvidence({...widget,priceText:'449.99',priceContext:'$449.00'});
 assert.equal(r.price,null);
});
