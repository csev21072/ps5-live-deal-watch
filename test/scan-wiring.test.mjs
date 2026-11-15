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
 assert.match(source,/probeSonyCart\(page,product,record\.sonyFacts,record\.priceText,record\.sonyPrice\)/);
});
