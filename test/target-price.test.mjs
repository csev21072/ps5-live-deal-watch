import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyTargetPriceHint,inspectTargetPriceHint} from '../src/probes/target-price.mjs';
const heading='PlayStation 5 NBA 2K26 Disc Bundle Console';
const product={name:heading,offers:{price:'449.99',priceCurrency:'USD'}};
test('matching Target JSON-LD product price remains unverified hint',()=>{
 const r=classifyTargetPriceHint({productHeading:heading,products:[product]});
 assert.equal(r.status,'structured-product-price-hint');
 assert.equal(r.amount,449.99);
 assert.equal(r.verifiedCheckout,false);
 assert.equal(r.verifiedStock,false);
});
test('unrelated accessory product price is ignored',()=>{
 const r=classifyTargetPriceHint({productHeading:heading,products:[{name:'PS5 Controller Charging Dock',offers:{price:29.99,priceCurrency:'USD'}}]});
 assert.equal(r.status,'price-hint-not-found');
});
test('wrong currency cannot qualify as price hint',()=>{
 const r=classifyTargetPriceHint({productHeading:heading,products:[{...product,offers:{price:'449.99',priceCurrency:'CAD'}}]});
 assert.equal(r.status,'price-hint-not-found');
});
test('conflicting product prices are ambiguous',()=>{
 const r=classifyTargetPriceHint({productHeading:heading,products:[{...product,offers:[{price:449,priceCurrency:'USD'},{price:499,priceCurrency:'USD'}]}]});
 assert.equal(r.status,'ambiguous-structured-prices');
});
test('price hint requires an exact product heading',()=>{
 const r=classifyTargetPriceHint({productHeading:'PS5',products:[product]});
 assert.equal(r.status,'product-heading-unconfirmed');
});
test('Target page inspection errors remain unverified',async()=>{
 const r=await inspectTargetPriceHint({evaluate:async()=>{throw Error('blocked')}},heading);
 assert.equal(r.status,'target-structured-data-unreadable');
 assert.equal(r.verifiedCheckout,false);
});
test('Target price hint does not modify checkout evidence',()=>{
 const r=classifyTargetPriceHint({productHeading:heading,products:[product]});
 assert.equal('checkoutEvidence' in r,false);
 assert.equal('orderable' in r,false);
});
