import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSonyProductFacts} from '../src/probes/playstation-direct.mjs';
const disc={
 url:'https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb',
 headings:['PlayStation®5 Console - 1 TB'],
 body:'PlayStation®5 Console - 1 TB\nThis console has a disc drive.\nWhat\'s in the Box\nPlayStation 5 console\nDualSense® Wireless Controller\nFeatures\nSlim, sleek and compact console design.\nPS5 console (CFI-2100 model group).',
 priceText:'$449.00'
};
test('official Sony disc product facts observed but checkout unverified',()=>{
 const r=inspectSonyProductFacts(disc);
 assert.equal(r.officialProductPage,true);
 assert.equal(r.storageHint,'1 TB');
 assert.equal(r.editionHint,'disc');
 assert.equal(r.discDriveHint,true);
 assert.equal(r.slimModelHint,true);
 assert.equal(r.oneDualSenseInBoxHint,true);
 assert.equal(r.phoenixCheckoutVerified,false);
 assert.equal(r.conditionVerified,false);
});
test('official Sony digital edition has no disc drive',()=>{
 const r=inspectSonyProductFacts({
  url:'https://direct.playstation.com/en-us/buy-consoles/playstation5-digital-edition-console-825-gb',
  headings:['PlayStation®5 Digital Edition Console - 825 GB'],
  body:'PlayStation 5 Digital Edition\nDISC-FREE CONSOLE\nWhat\'s in the Box\nDualSense Wireless Controller\nFeatures\nSlim, sleek and compact console design.'
 });
 assert.equal(r.editionHint,'digital');
 assert.equal(r.discDriveHint,false);
 assert.equal(r.storageHint,'825 GB');
});
test('refurbished console never becomes NEW',()=>{
 const r=inspectSonyProductFacts({...disc,headings:['Certified Refurbished PlayStation 5 Console - 1 TB']});
 assert.equal(r.status,'excluded-model');
 assert.equal(r.conditionVerified,false);
});
test('official catalog page is not a product page',()=>{
 const r=inspectSonyProductFacts({...disc,url:'https://direct.playstation.com/en-us/hardware/ps5'});
 assert.equal(r.officialProductPage,false);
});
test('lookalike domain cannot establish manufacturer facts',()=>{
 const r=inspectSonyProductFacts({...disc,url:'https://fake.direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb'});
 assert.equal(r.officialProductPage,false);
});
test('ambiguous disc drive text cannot prove drive type',()=>{
 const r=inspectSonyProductFacts({...disc,body:'This console has a disc drive. Other console no disc drive.'});
 assert.equal(r.discDriveHint,null);
});
test('unavailable checkout is never inferred from a price',()=>{
 const r=inspectSonyProductFacts({...disc,priceText:'$399.99'});
 assert.equal(r.displayedPriceHint,'$399.99');
 assert.equal(r.phoenixCheckoutVerified,false);
});
