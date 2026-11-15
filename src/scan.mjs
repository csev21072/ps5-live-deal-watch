import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {products,priceSelectors,ZIP} from './config.mjs';
import {priceFromText,evaluate} from './rules.mjs';
import {extractVisibleSignals,summarize} from './diagnostics.mjs';
import {probeGameStop} from './probes/gamestop.mjs';
import {discoverProducts} from './discovery.mjs';
import {summarizeProductEvidence} from './evidence/product.mjs';
import {inspectSonyProductFacts} from './probes/playstation-direct.mjs';
const outdir='out';
await mkdir(outdir,{recursive:true});
const browser=await chromium.launch({headless:true});
const records=[];
let discovery={candidates:[],coverage:[]};
try{discovery=await discoverProducts(browser,products);}catch(e){
  discovery={candidates:[],coverage:[{status:'discovery-failed',reason:String(e).slice(0,160)}]};
}
const allProducts=[...products,...discovery.candidates];
async function extractCandidate(page,product) {
  const observed=await page.evaluate((selectors)=>{
    const visible=(el)=>{if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&!!el.getClientRects().length;};
    let priceText='';
    for(const selector of selectors){try{const el=[...document.querySelectorAll(selector)].find(visible);if(el){priceText=(el.textContent||'').trim();if(priceText)break;}}catch{}}
    const productRoot=document.querySelector('main')||document.querySelector('[role="main"]')||document;
    const headings=[...productRoot.querySelectorAll('h1,h2')].filter(visible).slice(0,15).map(el=>(el.innerText||'').slice(0,180));
    const labels=[...productRoot.querySelectorAll('button,[role="button"],label')].filter(visible).map(el=>(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,120)).filter(x=>/^(?:new|pre.?owned|used|add to cart|not available|ship to home|pick up|pickup|find a store|same day delivery|buy now|check availability|select store|delivery|shipping|checkout|select condition)\b/i.test(x)).slice(0,40);
    return {title:document.title,body:(document.body?.innerText||'').slice(0,50000),priceText,headings,labels};
  },priceSelectors[product.retailer]||[]);
  const diagnostic=extractVisibleSignals(observed,product);
  const productEvidence=summarizeProductEvidence(observed,product);
  const sonyFacts=product.retailer==='PlayStation Direct'?inspectSonyProductFacts({url:page.url(),...observed}):null;
  // PlayStation Direct static URLs now point to individual console pages.
  const {blocked,unavailable}=diagnostic;
  const price=priceFromText(observed.priceText);
  // Diagnostic observations are NOT purchase evidence. Fulfillment is always
  // unconfirmed until a separately validated retailer checkout adapter exists.
  return {
    id:product.id,retailer:product.retailer,url:page.url(),host:product.host,
    kind:product.kind,checkedAt:new Date().toISOString(),source:'live-retailer-purchase-surface',
    title:observed.title,price,priceText:observed.priceText,
    blocked,unavailable,diagnostic,productEvidence,sonyFacts,locationRequested:ZIP,
    condition:null,seller:null,shipper:null,controllers:null,storage:null,discDrive:null,
    fulfillment:{confirmed:false,method:null,zip:null,text:null,locationText:null,cartOrCheckoutConfirmed:false},
    scanNote:diagnostic.status
  };
}
try {
  for(const product of allProducts){
    const page=await browser.newPage({locale:'en-US',timezoneId:'America/Phoenix',geolocation:{latitude:33.4484,longitude:-112.0740},permissions:['geolocation']});
    let record;
    try {
      await page.goto(product.url,{waitUntil:'domcontentloaded',timeout:25000});
      await page.waitForTimeout(1800);
      record=await extractCandidate(page,product);
      if(product.retailer==='GameStop'){
        const probeLimit=product.kind==='disc'?550:500;
        record.probe=record.price!==null && record.price<=probeLimit
          ? await probeGameStop(page,product,record.diagnostic,record.priceText,record.productEvidence?.productHeading)
          : {status:'skipped',reason:'price unknown or outside bounded probe range'};
        if(record.probe.status==='all-fulfillment-unavailable'){
          record.unavailable=true;
          record.diagnostic.status='unavailable';
          record.scanNote='shipping-and-pickup-unavailable-confirmed';
        }else if(record.probe.status==='shipping-unavailable-pickup-unverified'){
          record.diagnostic.status='shipping-unavailable-pickup-unknown';
          record.scanNote='shipping-unavailable-pickup-unknown';
        }
      }
    }catch(e){record={id:product.id,retailer:product.retailer,url:product.url,host:product.host,kind:product.kind,checkedAt:new Date().toISOString(),source:'unreadable',blocked:true,diagnostic:{status:'unreadable',evidence:[]},scanNote:String(e).slice(0,400)};}
    record.verdict=evaluate(record);
    records.push(record);
    console.log(`${product.id}: ${record.verdict.qualifies?'VERIFIED':'NO ALERT'} — ${record.scanNote}`);
    await page.close();
  }
}finally{await browser.close();}
await writeFile(`${outdir}/evidence.json`,JSON.stringify({checkedAt:new Date().toISOString(),zip:ZIP,discovery,records},null,2));
const stats=summarize(records);
const summary=['# PS5 free browser scan',`Checked ${records.length} retailer-owned product URLs across ${new Set(records.map(r=>r.retailer)).size} retailers.`, `Discovery attempts: ${discovery.coverage.length}; newly found URLs: ${discovery.candidates.length} (discovery alone is NEVER purchase evidence).`,`Verified qualifying offers: ${stats.confirmedPurchaseOffers}.`, `Readability: ${JSON.stringify(stats.statusCounts)}.`,'A successful scan does **not** mean all retailers were readable or Phoenix checkout was confirmed.','','| Retailer | Product | Status |','|---|---|---|',...records.map(r=>`| ${r.retailer} | ${r.id} | ${r.verdict.qualifies?'Verified':'No alert: '+(r.diagnostic?.status||r.scanNote||'incomplete').replaceAll('|','/')} |`)];
await writeFile(`${outdir}/summary.md`,summary.join('\n'));
if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,summary.join('\n')+'\n',{flag:'a'});
