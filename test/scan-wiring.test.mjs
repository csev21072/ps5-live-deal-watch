import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/scan.mjs',import.meta.url),'utf8');
test('scanner imports every Sony and audit helper it invokes',()=>{
 for(const name of ['probeSonyCart','parseSonyPriceEvidence','publicRetailerUrl']){
  assert.match(source,new RegExp('import \\{'+name+'\\} from'));
  assert.match(source,new RegExp(name+'\\('));
 }
});
test('Sony guest-cart probe is wired only to PlayStation Direct products',()=>{
 assert.match(source,/if\(product\.retailer==='PlayStation Direct'\)\s*\{\s*record\.probe=await probeSonyCart/);
});
test('scanner still requires the independent fail-closed verdict',()=>{
 assert.match(source,/record\.verdict=evaluate\(record\)/);
 assert.match(source,/await writeFile\(.*evidence\.json/);
});

test('GameStop guest cart is guarded by independently confirmed Disc/Digital edition',()=>{
 assert.match(source,/const editionConfirmed=record\.productEvidence\?\.editionHint===product\.kind/);
 assert.match(source,/record\.price<=probeLimit && editionConfirmed/);
});
test('Sony guest cart requires independently parsed retailer price widget',()=>{
 assert.match(source,/probeSonyCart\(page,product,record\.sonyFacts,record\.priceText,record\.sonyPrice,\{researchOnly:researchEdition===product\.kind\}\)/);
});

test('production scanner never imports fictional checkout fixtures or mocked GitHub',()=>{
 assert.doesNotMatch(source,/fictionalOffer|test\/fixtures|mock-github|simulate-offers/);
});

test('Target JSON-LD price remains a hint and is not assigned to verified offer price',()=>{
 assert.match(source,/record\.priceHint=await inspectTargetPriceHint/);
 assert.doesNotMatch(source,/record\.price\s*=\s*(?:record\.)?priceHint/);
});
test('five-retailer generic controls remain separate from the purchase verdict',()=>{
 assert.match(source,/record\.probe=await inspectProductControls/);
 assert.match(source,/record\.verdict=evaluate\(record\)/);
});
test('off-retailer redirects are rejected before product extraction',()=>{
 assert.match(source,/validateRetailerOrigin\(page\.url\(\),product\)/);
 assert.match(source,/if\(!origin\.valid\)throw new Error\(origin\.reason\)/);
});

test('GameStop global unavailability never creates a verified restock baseline',()=>{
 assert.match(source,/all-fulfillment-unavailable-unscoped/);
 assert.match(source,/record\.diagnostic\.status='unscoped-unavailability'/);
 assert.doesNotMatch(source,/record\.unavailable=true/);
});

test('public Actions logs never print raw browser exception details',()=>{
 assert.doesNotMatch(source,/scanNote:String\(e\)/);
 assert.match(source,/scanNote:'navigation-or-product-unreadable'/);
});

test('individual browser page failures cannot abort every remaining retailer',()=>{
 assert.match(source,/let page=null,record;\s*try\s*\{\s*page=await browser\.newPage/);
 assert.match(source,/if\(page\)await page\.close\(\)\.catch\(\(\)=>\{\}\)/);
});

