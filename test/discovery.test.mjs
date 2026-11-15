import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverFromLinks,searchPages} from '../src/discovery.mjs';
const store=(name)=>searchPages.find(x=>x.retailer===name);
test('only direct retailer-owned product URLs are candidates',()=>{
 const links=[
 {href:'https://www.gamestop.com/consoles-hardware/playstation-5/consoles/products/sony-playstation-5-slim-disc-console/999.html',text:'PlayStation 5 Slim Disc Console'},
 {href:'https://example.com/ps5',text:'PS5 Disc Console'},
 {href:'https://www.gamestop.com/search/?q=ps5',text:'PS5 Disc Console'}
 ];
 const r=discoverFromLinks(store('GameStop'),links);
 assert.equal(r.length,1);assert.equal(r[0].kind,'disc');
});
test('digital edition is classified without guessing',()=>{
 const r=discoverFromLinks(store('Amazon'),[{href:'https://www.amazon.com/dp/B0FRGTYSL5',text:'PlayStation 5 Slim Digital Edition Console'}]);
 assert.equal(r[0].kind,'digital');
});
test('generic console listing without edition is skipped',()=>{
 const r=discoverFromLinks(store('Amazon'),[{href:'https://www.amazon.com/dp/B0FRGTYSL5',text:'PlayStation 5 Console'}]);
 assert.equal(r.length,0);
});
test('refurbished and PS5 Pro do not qualify as candidates',()=>{
 const r=discoverFromLinks(store('Amazon'),[
 {href:'https://www.amazon.com/dp/B0FRGTYSL5',text:'Refurbished PS5 Disc Console'},
 {href:'https://www.amazon.com/dp/B0CL5KNB9M',text:'PS5 Pro Disc Console'}
 ]);
 assert.equal(r.length,0);
});
test('query tracking is stripped and duplicate product URL suppressed',()=>{
 const links=[
 {href:'https://www.amazon.com/dp/B0FRGTYSL5?tag=affiliate',text:'PS5 Disc Console'},
 {href:'https://www.amazon.com/dp/B0FRGTYSL5?tag=other',text:'PS5 Disc Console'}
 ];
 const r=discoverFromLinks(store('Amazon'),links);
 assert.equal(r.length,1);assert.equal(r[0].url,'https://www.amazon.com/dp/B0FRGTYSL5');
});
test('existing static product URL is not rediscovered',()=>{
 const r=discoverFromLinks(store('Amazon'),[{href:'https://www.amazon.com/dp/B0FRGTYSL5',text:'PS5 Disc Console'}],['https://www.amazon.com/dp/B0FRGTYSL5']);
 assert.equal(r.length,0);
});
test('at most two new products per retailer per scan',()=>{
 const r=discoverFromLinks(store('Walmart'),[1,2,3].map(n=>({href:'https://www.walmart.com/ip/'+n,text:'PS5 Digital Edition Console'})));
 assert.equal(r.length,2);
});
test('rejects http and unrelated domains',()=>{
 const r=discoverFromLinks(store('Target'),[
 {href:'http://www.target.com/p/ps5-disc-console/-/A-123',text:'PS5 Disc Console'},
 {href:'https://evil.target.com/p/ps5-disc-console/-/A-123',text:'PS5 Disc Console'}
 ]);
 assert.equal(r.length,0);
});

test('two-controller bundle URLs outrank ordinary console URLs',()=>{
 const r=discoverFromLinks(store('Walmart'),[
  {href:'https://www.walmart.com/ip/111111',text:'PS5 Disc Console'},
  {href:'https://www.walmart.com/ip/222222',text:'PS5 Disc Console'},
  {href:'https://www.walmart.com/ip/333333',text:'PS5 Disc Console Bundle with extra controller'}
 ],[],2);
 assert.equal(r.length,2);
 assert.equal(r[0].url,'https://www.walmart.com/ip/333333');
 assert.equal(r[0].discoveryPriority,2);
 assert.equal(r[0].discoveryOnly,true);
});
