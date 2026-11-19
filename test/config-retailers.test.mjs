import test from 'node:test';
import assert from 'node:assert/strict';
import {products,RETAILER_HOSTS} from '../src/config.mjs';

test('all seven required retailers have explicit candidate-page checks',()=>{
 const expected=['PlayStation Direct','Best Buy','Target','Walmart','Amazon','GameStop','Costco'];
 for(const retailer of expected){
   assert.ok(products.some(x=>x.retailer===retailer),retailer);
 }
 assert.deepEqual([...new Set(products.map(x=>x.retailer))].sort(),expected.sort());
});
test('explicit candidate URLs are HTTPS and approved exact retailer hosts',()=>{
 for(const product of products){
   const u=new URL(product.url);
   assert.equal(u.protocol,'https:',product.id);
   assert.equal(u.hostname,product.host,product.id);
   assert.ok(RETAILER_HOSTS[product.retailer].includes(product.host),product.id);
   assert.ok(['disc','digital'].includes(product.kind),product.id);
 }
});
test('newer Best Buy disc SKU remains tracked alongside legacy clearance SKU',()=>{
 const tracked=products.filter(x=>x.retailer==='Best Buy'&&x.kind==='disc');
 assert.ok(tracked.some(x=>new URL(x.url).pathname.endsWith('/6646419')));
 assert.ok(tracked.some(x=>new URL(x.url).pathname.endsWith('/6566039')));
});
