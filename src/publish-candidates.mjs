// Early-warning research alerts. These are observed retailer-page prices, NOT verified stock.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {publicAudit} from './public-audit.mjs';

const raw=JSON.parse(await readFile('out/evidence.json','utf8'));
const audit=publicAudit(raw);
const repo=process.env.GITHUB_REPOSITORY;
const token=process.env.GITHUB_TOKEN;
const safeRepo=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const candidates=audit.candidateResearch.candidates.filter(c=>
  c.price!==null &&
  c.price>0 &&
  c.price<=c.baseTarget &&
  ['attractive-price-checkout-unverified','attractive-price-but-not-orderable'].includes(c.status) &&
  audit.records.some(r=>r.id===c.id && r.url &&
    r.source==='live-retailer-purchase-surface' && !r.blocked &&
    r.retailer===c.retailer && r.kind===c.kind)
);
if(candidates.length===0){
  console.log('No retailer-page price leads below base target. No research alerts.');
  process.exit(0);
}
if(!repo||!safeRepo.test(repo)||!token)throw new Error('GitHub credentials required for research alerts');

async function github(path,opts={}){
  const res=await fetch('https://api.github.com/repos/'+repo+path,{
    ...opts,headers:{
      Accept:'application/vnd.github+json',
      Authorization:'Bearer '+token,
      'X-GitHub-Api-Version':'2022-11-28',
      'Content-Type':'application/json',
      ...opts.headers
    }
  });
  if(!res.ok)throw new Error('GitHub API '+res.status+' '+path);
  return res.json();
}

const issues=[];
for(let page=1;page<=10;page++){
  const batch=await github('/issues?state=all&per_page=100&page='+page);
  issues.push(...batch);
  if(batch.length<100)break;
  if(page===10)throw new Error('Too many issues to safely deduplicate research notifications');
}
let sent=0;
for(const candidate of candidates.slice(0,8)){
  const record=audit.records.find(r=>r.id===candidate.id && r.retailer===candidate.retailer && r.kind===candidate.kind && r.url);
  if(!record)continue;
  const cents=Math.round(candidate.price*100);
  const eventKey=createHash('sha256').update(
    [candidate.id,candidate.retailer,candidate.kind,cents,record.url].join('|')
  ).digest('hex');
  if(issues.some(issue=>String(issue.body??'').includes('Candidate event key: '+eventKey)))continue;
  const kind=candidate.kind==='disc'?'Disc':'Digital';
  const title='[PS5 PRICE LEAD - UNVERIFIED] $'+candidate.price.toFixed(2)+' '+kind+' - '+candidate.retailer;
  const body=[
    '## Potential PS5 price lead — CHECK YOURSELF',
    '**NOT VERIFIED AS PURCHASABLE.** This is an observed retailer product-page price, not confirmed stock or checkout eligibility. The listing may be sold out, pickup-only, unavailable for Phoenix shipping, or otherwise not orderable.',
    '',
    '- Retailer: '+candidate.retailer,
    '- Console edition: '+kind,
    '- Price observed: $'+candidate.price.toFixed(2),
    '- Price target: $'+candidate.baseTarget.toFixed(2),
    '- Checkout research result: '+candidate.status,
    '- Observed at: '+(record.checkedAt??audit.checkedAt??'unknown'),
    '- Open retailer listing and independently check price, seller, NEW condition, contents, cart, and Phoenix availability: '+record.url,
    '',
    'No purchase or checkout was performed. This issue is an early warning, not an availability guarantee.',
    'Candidate event key: '+eventKey
  ].join('\n');
  try{
    await github('/issues',{method:'POST',body:JSON.stringify({title,body,assignees:[repo.split('/')[0]]})});
  }catch(e){
    if(!String(e).includes('GitHub API 422'))throw e;
    await github('/issues',{method:'POST',body:JSON.stringify({title,body})});
  }
  issues.push({body});
  sent++;
  console.log('Created UNVERIFIED price lead for '+candidate.retailer+' '+kind+' $'+candidate.price.toFixed(2));
}
console.log('Research price leads: '+candidates.length+' observed, '+sent+' new notifications.');