import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeProductEvidence} from '../src/evidence/product.mjs';
const product={id:'gamestop-disc-bundle',retailer:'GameStop'};
test('captures visible SKU, seller and shipping quotes without asserting verification',()=>{
 const observed={
  title:'GameStop PlayStation 5',
  headings:['Sony PlayStation 5 Slim Disc Edition Console'],
  labels:['New','Ship to Home','Pick up in-store'],
  priceText:'$449.99',
  body:'Sony PlayStation 5 Slim Disc Edition Console\nSKU 422135\nCondition New\nSold by GameStop\nShip to Home\nNot Available\nPick up in-store\nFind a Store'
 };
 const r=summarizeProductEvidence(observed,product);
 assert.equal(r.editionHint,'disc');
 assert.equal(r.selectedOfferPrice,'$449.99');
 assert.equal(r.phoenixCheckoutVerified,false);
 assert.equal(r.conditionVerified,false);
 assert.ok(r.highlights.some(x=>x.includes('SKU')));
});
test('generic title cannot establish edition',()=>{
 const r=summarizeProductEvidence({title:'PS5',headings:['PlayStation 5 Console'],priceText:'$399.99'},product);
 assert.equal(r.editionHint,'unknown');
});
test('multiple prices never become a selected price',()=>{
 const r=summarizeProductEvidence({headings:['PlayStation 5 Digital Edition'],priceText:'$399.99 $499.99'},product);
 assert.equal(r.selectedOfferPrice,null);
});
test('unavailable badge in unrelated line cannot become checkout confirmation',()=>{
 const r=summarizeProductEvidence({headings:['PS5 Digital Edition'],body:'Other product Sold Out\nShip to Home\nAvailable'},product);
 assert.equal(r.phoenixCheckoutVerified,false);
 assert.equal(r.verificationLevel,'diagnostic-only');
});
test('bounds page content and excludes unrelated private account text',()=>{
 const r=summarizeProductEvidence({headings:['PS5 Disc Edition'],body:'Private account name and email\n'+Array.from({length:80},(_,i)=>'PS5 product line '+i).join('\n')},product);
 assert.ok(r.highlights.length<=24);
 assert.ok(!JSON.stringify(r).includes('Private account name'));
});
test('price and condition are not verified from labels alone',()=>{
 const r=summarizeProductEvidence({headings:['PS5 Disc Edition'],labels:['New','Add to Cart'],priceText:'$399.99'},product);
 assert.equal(r.conditionVerified,false);
 assert.equal(r.sellerVerified,false);
 assert.equal(r.skuVerified,false);
});

test('SKU and two-controller hints remain explicitly unverified',()=>{
 const r=summarizeProductEvidence({
  headings:['Sony PlayStation 5 Slim Disc Console 1TB'],
  body:'Sony PlayStation 5 Slim Disc Console 1TB\nSKU: 422135\nIncludes 2 DualSense wireless controllers'
 },product);
 assert.equal(r.skuHint,'422135');
 assert.equal(r.extraControllerHint,true);
 assert.equal(r.storageHint,'1TB');
 assert.equal(r.skuVerified,false);
 assert.equal(r.phoenixCheckoutVerified,false);
});
test('generic DualSense mention does not imply extra controller',()=>{
 const r=summarizeProductEvidence({
  headings:['Sony PlayStation 5 Slim Digital Edition 825GB'],
  body:'Sony PlayStation 5 Slim Digital Edition 825GB\nIncludes DualSense wireless controller'
 },product);
 assert.equal(r.extraControllerHint,false);
});
