import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluate} from './rules.mjs';
import {processRecords,offerSignature} from './alerts/state.mjs';

const {records}=JSON.parse(await readFile('out/evidence.json','utf8'));
let previous={};
try {
  previous=JSON.parse(await readFile('out/previous-alert-state.json','utf8'));
  if(!previous || Array.isArray(previous) || typeof previous!=='object')throw new Error('invalid state');
}catch(e){
  if(e.code!=='ENOENT')throw e; // Invalid state must fail closed, never reset history.
}
const verdicts=records.map(r=>evaluate(r));
const {next,alerts,decisions}=processRecords(previous,records,verdicts);
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GITHUB_TOKEN;
if(alerts.length && (!repo||!token))
  throw new Error('Cannot publish verified offers without authenticated GitHub notifications');

async function github(path,opts={}){
  const r=await fetch(`https://api.github.com/repos/${repo}`+path,{
    ...opts,headers:{
      'Accept':'application/vnd.github+json',
      'Authorization':`Bearer ${token}`,
      'X-GitHub-Api-Version':'2022-11-28',
      'Content-Type':'application/json',...opts.headers
    }
  });
  if(!r.ok)throw new Error(`GitHub API ${r.status} ${path}`);
  return r.json();
}
async function issueBodies(){
  const issues=[];
  for(let page=1;page<=10;page++){
    const batch=await github(`/issues?state=all&per_page=100&page=${page}`);
    issues.push(...batch);
    if(batch.length<100)return issues;
  }
  // An incomplete issue history cannot prove deduplication.
  throw new Error('Issue history exceeded safe deduplication pagination limit');
}
const previousIssues=alerts.length?await issueBodies():[];
for(const record of alerts){
  const decision=decisions.find(x=>x.id===record.id);
  const old=previous[record.id]??{};
  const signature=offerSignature(record);
  const keyInput=[
    record.id,decision.reason,signature,record.price,
    decision.reason==='verified-restock'?old.lastUnavailableAt??'':''
  ].join('|');
  const eventKey=createHash('sha256').update(keyInput).digest('hex');
  if(previousIssues.some(x=>x.body?.includes(`Alert event key: ${eventKey}`))){
    console.log(`Already notified for verified event ${record.id}; not repeating.`);
    continue;
  }
  const verdict=evaluate(record);
  if(!verdict.qualifies)throw new Error('Offer became stale or invalid before publishing');
  const title=`[PS5 VERIFIED ${record.id}] $${record.price.toFixed(2)} ${record.exactModel}`;
  const body=[
    '**Verified retailer-owned purchase evidence**',
    `- Retailer: ${record.retailer}`,
    `- Product: ${record.exactModel} / ${record.skuOrBundle}`,
    `- Price: $${record.price.toFixed(2)} (${record.priceText})`,
    `- Seller / shipper: ${record.seller} / ${record.shipper}`,
    `- Condition: NEW (${record.conditionText})`,
    `- Storage: ${record.storage}`,
    `- Disc drive: ${record.discDrive?'Yes':'No'}`,
    `- Controllers: ${record.controllers}`,
    `- Fulfillment: ${record.fulfillment.method} in ZIP ${record.fulfillment.zip}`,
    `- Exact fulfillment evidence: ${record.fulfillment.text}`,
    `- Location evidence: ${record.fulfillment.locationText}`,
    `- Conditions: ${record.conditions??'None observed'}`,
    `- Effective price: $${verdict.effectivePrice.toFixed(2)} = $${record.price.toFixed(2)} - $${verdict.extraControllerCredit} extra-controller allowance - $${verdict.gameCredit} documented game allowance`,
    `- Previous sufficiently verified alerted price: ${old.lastAlert ? '    `- Retailer URL: ${record.url}`,
    `- Alert reason: ${decision.reason}`,
    `- Alert event key: ${eventKey}`
  ].join('\n');
  await github('/issues',{method:'POST',body:JSON.stringify({title,body})});
  previousIssues.push({body});
  console.log(`Created independently verified purchase alert for ${record.id}`);
}
// State advances only after all required notifications succeeded.
// Audit branch stores this, not the public main branch.
await writeFile('out/alert-state.json',JSON.stringify(next,null,2));
console.log(`Evaluated ${records.length} retailer candidates; ${alerts.length} verified alert events.`);
+old.lastAlert.price.toFixed(2) : 'none recorded'}`,
    `- Checked at: ${record.checkedAt}`,
    `- Retailer URL: ${record.url}`,
    `- Alert reason: ${decision.reason}`,
    `- Alert event key: ${eventKey}`
  ].join('\n');
  await github('/issues',{method:'POST',body:JSON.stringify({title,body})});
  previousIssues.push({body});
  console.log(`Created independently verified purchase alert for ${record.id}`);
}
// State advances only after all required notifications succeeded.
// Audit branch stores this, not the public main branch.
await writeFile('out/alert-state.json',JSON.stringify(next,null,2));
console.log(`Evaluated ${records.length} retailer candidates; ${alerts.length} verified alert events.`);
