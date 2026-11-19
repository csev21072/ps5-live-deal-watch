import test from 'node:test';
import assert from 'node:assert/strict';
import {assessSonyCartControls} from '../src/probes/sony-cart-controls.mjs';
const expected={sku:'1000049888',productName:'PlayStation®5 Console - 1 TB',price:649};
const row={sku:expected.sku,title:expected.productName,priceText:'$649.00',quantity:'1'};
test('observed Sony guest cart matches exact SKU/title/price but cannot verify fulfillment',()=>{
 const r=assessSonyCartControls({rows:[row],checkoutEnabled:true},expected);
 assert.deepEqual(r.matchingRows,[{skuMatched:true,itemPriceMatched:true,quantityOne:true,newCondition:false}]);
 assert.equal(r.checkoutControlEnabled,true);assert.equal(r.verifiedPurchase,false);
 assert.equal(r.selectedFulfillment.length,0);assert.ok(r.missing.includes('Phoenix fulfillment not observed'));
});
test('partial SKU and different console edition do not match',()=>{
 for(const change of [{sku:'10000498880'},{title:'PlayStation®5 Digital Edition Console - 825 GB'}]){
 assert.equal(assessSonyCartControls({rows:[{...row,...change}]},expected).matchingRows.length,0);}
});
test('totals, recommendations and changed line prices cannot supply console price',()=>{
 for(const priceText of ['Subtotal $649.00','$599.00','$649.00 $54.00','']){
 const r=assessSonyCartControls({rows:[{...row,priceText}],subtotal:'$649.00',recommendations:[row]},expected);
 assert.equal(r.matchingRows[0].itemPriceMatched,false);}
});
test('extra items, duplicate rows and quantity changes remain incomplete',()=>{
 for(const rows of [[row,row],[row,{...row,sku:'1000049999'}]]){
 assert.ok(assessSonyCartControls({rows},expected).missing.includes('exactly one matching console and no extra cart items'));}
 assert.ok(assessSonyCartControls({rows:[{...row,quantity:'2'}]},expected).missing.includes('console quantity one'));
});
