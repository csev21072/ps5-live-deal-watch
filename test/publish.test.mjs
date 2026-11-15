import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,mkdir,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const publisher=resolve(fileURLToPath(new URL('../src/publish.mjs',import.meta.url)));
async function run(records,previous='{}'){
 const dir=await mkdtemp(join(tmpdir(),'ps5-publisher-test-'));
 await mkdir(join(dir,'out'));
 await writeFile(join(dir,'out','evidence.json'),JSON.stringify({records}));
 await writeFile(join(dir,'out','previous-alert-state.json'),previous);
 const result=spawnSync(process.execPath,[publisher],{
   cwd:dir,encoding:'utf8',timeout:12000,
   env:{PATH:process.env.PATH,HOME:process.env.HOME}
 });
 return {dir,result};
}
async function cleanup(dir){await rm(dir,{recursive:true,force:true});}
test('publisher writes empty durable state for empty scan',async()=>{
 const x=await run([]);
 try{
  assert.equal(x.result.status,0,x.result.stderr);
  assert.deepEqual(JSON.parse(await readFile(join(x.dir,'out','alert-state.json'),'utf8')),{});
 }finally{await cleanup(x.dir);}
});
test('publisher preserves incomplete offer without notification',async()=>{
 const x=await run([{id:'game-1',retailer:'GameStop',checkedAt:new Date().toISOString(),source:'unreadable'}]);
 try{
  assert.equal(x.result.status,0,x.result.stderr);
  const state=JSON.parse(await readFile(join(x.dir,'out','alert-state.json'),'utf8'));
  assert.equal(state['game-1'].status,'unknown');
 }finally{await cleanup(x.dir);}
});
test('invalid previous history fails closed without resetting state',async()=>{
 const x=await run([],'this is not JSON');
 try{
  assert.notEqual(x.result.status,0);
  await assert.rejects(access(join(x.dir,'out','alert-state.json')));
 }finally{await cleanup(x.dir);}
});
test('fully verified offer cannot notify without GitHub credentials',async()=>{
 const t=new Date().toISOString();
 const r={id:'test-disc',retailer:'GameStop',url:'https://www.gamestop.com/products/ps5',host:'www.gamestop.com',
   kind:'disc',source:'live-retailer-purchase-surface',checkedAt:t,
   exactModel:'Sony PS5 Slim Disc',skuOrBundle:'SKU-1',condition:'NEW',conditionText:'Condition New',
   seller:'GameStop',sellerText:'Sold by GameStop',shipper:'GameStop',shipperText:'Shipped by GameStop',
   controllers:1,storage:'1TB',discDrive:true,price:449,priceText:'$449.00',
   fulfillment:{confirmed:true,method:'ship-to-home',zip:'85001',text:'Shipping to Phoenix 85001, orderable',locationText:'Phoenix 85001',cartOrCheckoutConfirmed:true},
   checkoutEvidence:{url:'https://www.gamestop.com/cart',observedAt:t,skuOrBundle:'SKU-1',priceText:'$449.00',zip:'85001',fulfillmentText:'Shipping to Phoenix 85001, orderable',orderable:true,itemText:'Sony PS5 Slim Disc SKU-1 $449.00',selectedCondition:'NEW',selectedSeller:'GameStop',selectedFulfillmentMethod:'ship-to-home',checkoutControlEnabled:true}
 };
 const x=await run([r]);
 try{
  assert.notEqual(x.result.status,0);
  assert.match(x.result.stderr,/Cannot publish verified offers/);
  await assert.rejects(access(join(x.dir,'out','alert-state.json')));
 }finally{await cleanup(x.dir);}
});
