import test from 'node:test';
import assert from 'node:assert/strict';
import {publicRetailerUrl} from '../src/evidence/url.mjs';
test('public retailer URL removes query tokens and fragments',()=>{
 const r=publicRetailerUrl('https://www.gamestop.com/cart/?session=secret&token=private#checkout','www.gamestop.com');
 assert.equal(r,'https://www.gamestop.com/cart/');
 assert.ok(!r.includes('secret'));
});
test('refuses embedded credentials',()=>{
 assert.equal(publicRetailerUrl('https://user:password@www.gamestop.com/cart','www.gamestop.com'),null);
});
test('refuses third-party domains',()=>{
 assert.equal(publicRetailerUrl('https://fake.gamestop.com/cart?token=secret','www.gamestop.com'),null);
});
test('refuses non-HTTPS URLs',()=>{
 assert.equal(publicRetailerUrl('http://www.gamestop.com/cart','www.gamestop.com'),null);
});
test('preserves exact retailer-owned product path',()=>{
 const r=publicRetailerUrl('https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb?smcid=tracking','direct.playstation.com');
 assert.equal(r,'https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb');
});
