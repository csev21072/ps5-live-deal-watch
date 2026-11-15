import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRetailerOrigin} from '../src/checkout/origin.mjs';
const product={retailer:'GameStop',host:'www.gamestop.com'};
test('exact retailer HTTPS origin is valid',()=>{
 assert.equal(validateRetailerOrigin('https://www.gamestop.com/cart?ref=abc',product).valid,true);
});
test('lookalike retailer subdomain is rejected',()=>{
 assert.equal(validateRetailerOrigin('https://checkout.gamestop.com/cart',product).valid,false);
 assert.equal(validateRetailerOrigin('https://www.gamestop.com.evil.example/cart',product).valid,false);
});
test('retailer redirects to login or challenge are rejected',()=>{
 assert.equal(validateRetailerOrigin('https://www.gamestop.com/login',product).valid,false);
 assert.equal(validateRetailerOrigin('https://www.gamestop.com/challenge/verify',product).valid,false);
});
test('insecure and embedded-credential URLs are rejected',()=>{
 assert.equal(validateRetailerOrigin('http://www.gamestop.com/cart',product).valid,false);
 assert.equal(validateRetailerOrigin('https://user:secret@www.gamestop.com/cart',product).valid,false);
});
test('another retailer cannot inherit an approved origin',()=>{
 assert.equal(validateRetailerOrigin('https://www.amazon.com/dp/B0EXAMPLE1',product).valid,false);
});
