import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverFromLinks,searchPages,classifyDiscoveryPage} from '../src/discovery.mjs';
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

test('official PlayStation Direct buy-consoles product URL can be discovered',()=>{
 const r=discoverFromLinks(store('PlayStation Direct'),[{
  href:'https://direct.playstation.com/en-us/buy-consoles/playstation5-digital-edition-console-825-gb',
  text:'PlayStation 5 Digital Edition Console 825GB'
 }]);
 assert.equal(r.length,1);
 assert.equal(r[0].kind,'digital');
});
test('PS5-compatible face plates are not console candidates',()=>{
 const r=discoverFromLinks(store('Amazon'),[{
  href:'https://www.amazon.com/dp/B0FRGTYSL5',
  text:'Face Plates for PS5 Slim Disc Edition Only, replacement cover compatible with PlayStation 5 Slim Disc Edition Consoles'
 }]);
 assert.equal(r.length,0);
});
test('PS5 cooling accessories cannot be mistaken for bundles',()=>{
 const r=discoverFromLinks(store('Walmart'),[{
  href:'https://www.walmart.com/ip/12345678',
  text:'PS5 Digital Edition Console Cooling Fan Accessories Bundle'
 }]);
 assert.equal(r.length,0);
});

test('CAPTCHA search page is blocked even if it has product-looking links',()=>{
 const r=classifyDiscoveryPage({title:'Verify you are human',body:'Press & hold',links:[{href:'https://www.amazon.com/dp/B0FRGTYSL5',text:'PS5 Disc Console'}]});
 assert.equal(r,'blocked');
});
test('retailer search page with no readable links is not considered inspected',()=>{
 assert.equal(classifyDiscoveryPage({title:'Search',body:'Loading',links:[]}), 'no-readable-links');
});
test('ordinary retailer search page with links can be inspected',()=>{
 assert.equal(classifyDiscoveryPage({title:'PS5',body:'Search results',links:[{href:'https://www.amazon.com/dp/B0FRGTYSL5'}]}),'inspected');
});

test('two DualSense wireless controllers receive discovery priority without verified value',()=>{
 const r=discoverFromLinks(store('Walmart'),[
  {href:'https://www.walmart.com/ip/111111',text:'PS5 Disc Console'},
  {href:'https://www.walmart.com/ip/222222',text:'PS5 Disc Console Bundle with 2 DualSense Wireless Controllers'}
 ],[],1);
 assert.equal(r.length,1);
 assert.equal(r[0].url,'https://www.walmart.com/ip/222222');
 assert.equal(r[0].discoveryOnly,true);
});
