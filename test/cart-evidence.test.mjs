import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedSkuFromProductUrl,inspectCartText} from '../src/evidence/cart.mjs';
const base={
 cartUrl:'https://www.gamestop.com/cart/',
 productUrl:'https://www.gamestop.com/consoles-hardware/playstation-5/consoles/products/sony-playstation-5-disc/422135.html',
 productHeading:'Sony PlayStation 5 Disc Console',
 priceText:'$449.99',
 cartText:'Shopping Cart\nSony PlayStation 5 Disc Console\nSKU 422135\n$449.99\nShipping to Phoenix 85001\nCheckout'
};
test('extracts exact GameStop SKU from URL',()=>assert.equal(expectedSkuFromProductUrl(base.productUrl),'422135'));
test('matching item row is still not verified checkout',()=>{
 const r=inspectCartText(base);
 assert.equal(r.skuFoundInCart,true);
 assert.equal(r.exactProductTitleFound,true);
 assert.equal(r.productPriceMatched,true);
 assert.equal(r.zipInShippingContext,true);
 assert.equal(r.verifiedCheckout,false);
 assert.equal(r.status,'item-price-seen-not-checkout');
});
test('unrelated cart item price does not count',()=>{
 const r=inspectCartText({...base,cartText:'Shopping Cart\nSony PlayStation 5 Disc Console\nSKU 422135\n$399.99\nApple iPad\n$449.99'});
 assert.equal(r.productPriceMatched,false);
});
test('ZIP elsewhere without shipping context is insufficient',()=>{
 const r=inspectCartText({...base,cartText:'Shopping Cart\nSony PlayStation 5 Disc Console\nSKU 422135\n$449.99\nYour last search: 85001'});
 assert.equal(r.zipInShippingContext,false);
});
test('cart with a different SKU is not a matching SKU',()=>{
 const r=inspectCartText({...base,cartText:'Shopping Cart\nSony PlayStation 5 Disc Console\nSKU 999999\n$449.99'});
 assert.equal(r.skuFoundInCart,false);
 assert.equal(r.verifiedCheckout,false);
});
test('no item match rejects unrelated cart',()=>{
 const r=inspectCartText({...base,cartText:'Shopping Cart\nApple iPad\n$449.99\nShipping to Phoenix 85001'});
 assert.equal(r.status,'item-not-found');
});
test('CAPTCHA rejects even when cart contains a matching SKU',()=>{
 const r=inspectCartText({...base,cartText:base.cartText+'\nVerify you are human CAPTCHA'});
 assert.equal(r.status,'blocked');assert.equal(r.verifiedCheckout,false);
});
test('wrong host rejects cart evidence',()=>{
 const r=inspectCartText({...base,cartUrl:'https://other.example.com/cart'});
 assert.equal(r.status,'wrong-cart-origin');
});
test('unavailable matching item rejects despite visible price',()=>{
 const r=inspectCartText({...base,cartText:'Sony PlayStation 5 Disc Console\nSKU 422135\n$449.99\nOut of Stock\nShipping to Phoenix 85001'});
 assert.equal(r.status,'item-unavailable');
});
test('ambiguous multiple item prices do not count',()=>{
 const r=inspectCartText({...base,cartText:'Sony PlayStation 5 Disc Console\nSKU 422135\n$449.99\n$499.99\nShipping to Phoenix 85001'});
 assert.equal(r.productPriceMatched,false);
});

test('a larger SKU containing expected digits does not match',()=>{
 const r=inspectCartText({...base,cartText:'Sony PlayStation 5 Disc Console\nSKU 1422135\n$449.99\nShipping to Phoenix 85001'});
 assert.equal(r.skuFoundInCart,false);
});
test('shipping to a ZIP containing Phoenix digits is not Phoenix fulfillment',()=>{
 const r=inspectCartText({...base,cartText:'Sony PlayStation 5 Disc Console\nSKU 422135\n$449.99\nShipping to Phoenix 185001'});
 assert.equal(r.zipInShippingContext,false);
});
test('cart evidence does not publish personal details from cart text',()=>{
 const r=inspectCartText({...base,cartText:base.cartText+'\nJane Example jane@example.org 123 Main Street'});
 assert.ok(!JSON.stringify(r).includes('Jane'));
 assert.ok(!JSON.stringify(r).includes('Main Street'));
 assert.ok(!JSON.stringify(r).includes('example.org'));
});
