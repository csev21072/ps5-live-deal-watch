import test from 'node:test';
import assert from 'node:assert/strict';
import {labeledSellerMatches,labeledShipperMatches} from '../src/checkout/seller.mjs';
test('positive retailer labels establish seller and shipper identities',()=>{
 assert.equal(labeledSellerMatches('Sold by GameStop','GameStop'),true);
 assert.equal(labeledSellerMatches('Seller: Amazon.com','Amazon.com'),true);
 assert.equal(labeledShipperMatches('Shipped by GameStop','GameStop'),true);
 assert.equal(labeledShipperMatches('Ships from Amazon.com','Amazon.com'),true);
});
test('negative seller and shipper evidence never establishes identity',()=>{
 assert.equal(labeledSellerMatches('Not Sold by GameStop','GameStop'),false);
 assert.equal(labeledSellerMatches('Never sold by GameStop','GameStop'),false);
 assert.equal(labeledShipperMatches('Not shipped by GameStop','GameStop'),false);
});
test('retailer name appearing in unrelated text is not seller evidence',()=>{
 assert.equal(labeledSellerMatches('GameStop warranty, sold by Third Party','GameStop'),false);
 assert.equal(labeledShipperMatches('Ships from Third Party; GameStop shipping policies','GameStop'),false);
});
test('seller names are matched as complete tokens, not substrings',()=>{
 assert.equal(labeledSellerMatches('Sold by GameStopper','GameStop'),false);
 assert.equal(labeledShipperMatches('Shipped by Amazon.commerce','Amazon.com'),false);
});
test('empty and unreasonably large identities fail closed',()=>{
 assert.equal(labeledSellerMatches('Sold by GameStop',''),false);
 assert.equal(labeledShipperMatches('Shipped by GameStop','x'.repeat(100)),false);
});
