import {readFile} from 'node:fs/promises';
import {evaluate} from './rules.mjs';
const {records}=JSON.parse(await readFile('out/evidence.json','utf8'));
const eligible=records.filter(r=>evaluate(r).qualifies);
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN;
if(!repo||!token){console.log('No GitHub token/repository: local dry run only.');process.exit(0);}
const api=`https://api.github.com/repos/${repo}`;
async function github(path,opts={}){
 const r=await fetch(api+path,{...opts,headers:{'Accept':'application/vnd.github+json','Authorization':`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json',...opts.headers}});
 if(!r.ok)throw new Error(`GitHub API ${r.status} ${path}`);return r.json();
}
const existing=eligible.length ? await github('/issues?state=all&per_page=100') : [];
for(const record of eligible){
 const key=`[PS5 VERIFIED ${record.id}]`;
 const previous=existing.filter(x=>x.title?.startsWith(key));
 const signature=`${record.price}|${record.seller}|${record.shipper}|${record.skuOrBundle}|${record.fulfillment.method}|${record.fulfillment.zip}|${record.conditions??''}`;
 if(previous.some(x=>x.body?.includes(`Offer signature: ${signature}`)))continue;
 const v=evaluate(record);
 const title=`${key} $${record.price.toFixed(2)} ${record.exactModel}`;
 const body=[`**Verified retailer-owned purchase evidence**`, `- Retailer: ${record.retailer}`,`- Product: ${record.exactModel} / ${record.skuOrBundle}`,`- Price: $${record.price.toFixed(2)} (${record.priceText})`,`- Seller / shipper: ${record.seller} / ${record.shipper}`,`- Condition: NEW (${record.conditionText})`,`- Storage: ${record.storage}`,`- Disc drive: ${record.discDrive?'Yes':'No'}`,`- Controllers: ${record.controllers}`,`- Fulfillment: ${record.fulfillment.method} in ZIP ${record.fulfillment.zip}`,`- Exact fulfillment evidence: ${record.fulfillment.text}`,`- Location evidence: ${record.fulfillment.locationText}`,`- Conditions: ${record.conditions??'None observed'}`,`- Effective price: $${v.effectivePrice.toFixed(2)} = $${record.price.toFixed(2)} - $${v.extraControllerCredit} extra-controller allowance - $${v.gameCredit} documented game allowance`,`- Checked at: ${record.checkedAt}`,`- Retailer URL: ${record.url}`,`- Offer signature: ${signature}`].join('\n');
 await github('/issues',{method:'POST',body:JSON.stringify({title,body})});
 console.log(`Created verified offer issue: ${title}`);
}
