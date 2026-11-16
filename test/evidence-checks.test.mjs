import test from 'node:test';
import assert from 'node:assert/strict';
import {exactSkuInText,exactZipInText,selectedFulfillmentMatches,exactItemPriceInText} from '../src/checkout/evidence-checks.mjs';
test('SKU matching rejects longer adjacent SKUs',()=>{
 assert.equal(exactSkuInText('PS5 SKU 422135 New','422135'),true);
 assert.equal(exactSkuInText('PS5 SKU 1422135 New','422135'),false);
 assert.equal(exactSkuInText('PS5 SKU 4221359 New','422135'),false);
 assert.equal(exactSkuInText('PS5 SKU-123 New','SKU-123'),true);
 assert.equal(exactSkuInText('PS5 SKU-1234 New','SKU-123'),false);
});
test('SKU matching escapes special characters',()=>{
 assert.equal(exactSkuInText('PS5 SKU (A.123) New','(A.123)'),true);
 assert.equal(exactSkuInText('PS5 SKU (AX123) New','(A.123)'),false);
});
test('ZIP matching rejects longer ZIP digit sequences',()=>{
 assert.equal(exactZipInText('Shipping to 85001'),true);
 assert.equal(exactZipInText('Shipping to 185001'),false);
 assert.equal(exactZipInText('Shipping to 850012'),false);
 assert.equal(exactZipInText('Shipping to 85001-1234'),true);
});
test('ZIP elsewhere without fulfillment context is not selected shipping',()=>{
 assert.equal(selectedFulfillmentMatches('Recently viewed: 85001'),false);
 assert.equal(selectedFulfillmentMatches('Ship to Home — Phoenix 85001'),true);
 assert.equal(selectedFulfillmentMatches('Ship to Home — Phoenix 185001'),false);
 assert.equal(selectedFulfillmentMatches('Ship to Home — Phoenix 85001 Not Available'),false);
});
test('exact item price refuses unrelated totals and wrong cents',()=>{
 assert.equal(exactItemPriceInText('PS5 Slim $449.99',449.99),true);
 assert.equal(exactItemPriceInText('PS5 Slim $449.00',449.99),false);
 assert.equal(exactItemPriceInText('PS5 $449.99 Subtotal $899.98',449.99),false);
 assert.equal(exactItemPriceInText('PS5 $1,049.99',1049.99),true);
});

test('negative Phoenix fulfillment eligibility language is rejected',()=>{
 for(const label of [
  'Shipping to Phoenix 85001 is not eligible',
  'Delivery to 85001 not supported',
  'Ship to Home 85001 not offered',
  'Pickup in 85001 not orderable',
  'Unable to ship to Phoenix 85001',
  'No delivery to Phoenix 85001',
  'Shipping to 85001 restricted'
 ])assert.equal(selectedFulfillmentMatches(label,'85001'),false,label);
});
