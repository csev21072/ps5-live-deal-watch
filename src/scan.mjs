import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {products,priceSelectors,ZIP} from './config.mjs';
import {priceFromText,evaluate} from './rules.mjs';
const outdir='out';
await mkdir(outdir,{recursive:true});
const browser=await chromium.launch({headless:true});
const records=[];
async function extractCandidate(page,product) {
  const observed=await page.evaluate((selectors)=>{
    const visible=(el)=>{if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&!!el.getClientRects().length;};
    let priceText='';
    for(const selector of selectors){try{const el=[...document.querySelectorAll(selector)].find(visible);if(el){priceText=(el.textContent||'').trim();if(priceText)break;}}catch{}}
    return {title:document.title,body:(document.body?.innerText||'').slice(0,50000),priceText};
  },priceSelectors[product.retailer]||[]);
  const body=observed.body;
  const blocked=/press\s*&\s*hold to confirm|robot or human|verify you are human|captcha|access denied|something went wrong/i.test(body.slice(0,8000));
  const unavailable=/\b(out of stock|sold out|ship to home:\s*not available|shipping:\s*not available|not available online|currently unavailable)\b/i.test(body);
  const price=priceFromText(observed.priceText);
  // Intentionally fail-closed: retailer-specific Phoenix cart/checkout
  // verification is not implemented. Candidate prices are NOT alerts.
  return {
    id:product.id,retailer:product.retailer,url:page.url(),host:product.host,
    kind:product.kind,checkedAt:new Date().toISOString(),source:'live-retailer-purchase-surface',
    title:observed.title,price,priceText:observed.priceText,
    blocked,unavailable,locationRequested:ZIP,
    condition:null,seller:null,shipper:null,controllers:null,storage:null,discDrive:null,
    fulfillment:{confirmed:false,method:null,zip:null,text:null,locationText:null,cartOrCheckoutConfirmed:false},
    scanNote:blocked?'CAPTCHA / bot protection or page error':unavailable?'Unavailability text detected':'Live page inspected; checkout and Phoenix shipping NOT verified'
  };
}
try {
  for(const product of products){
    const page=await browser.newPage({locale:'en-US',timezoneId:'America/Phoenix',geolocation:{latitude:33.4484,longitude:-112.0740},permissions:['geolocation']});
    let record;
    try {
      await page.goto(product.url,{waitUntil:'domcontentloaded',timeout:25000});
      await page.waitForTimeout(1800);
      record=await extractCandidate(page,product);
    }catch(e){record={id:product.id,retailer:product.retailer,url:product.url,host:product.host,kind:product.kind,checkedAt:new Date().toISOString(),source:'unreadable',blocked:true,scanNote:String(e).slice(0,400)};}
    record.verdict=evaluate(record);
    records.push(record);
    console.log(`${product.id}: ${record.verdict.qualifies?'VERIFIED':'NO ALERT'} — ${record.scanNote}`);
    await page.close();
  }
}finally{await browser.close();}
await writeFile(`${outdir}/evidence.json`,JSON.stringify({checkedAt:new Date().toISOString(),zip:ZIP,records},null,2));
const summary=['# PS5 free browser scan',`Checked ${records.length} URLs across ${new Set(records.map(r=>r.retailer)).size} retailers.`,`Verified qualifying offers: ${records.filter(r=>r.verdict.qualifies).length}.`,'A successful scan does **not** mean all retailers were readable or Phoenix checkout was confirmed.','','| Retailer | Product | Status |','|---|---|---|',...records.map(r=>`| ${r.retailer} | ${r.id} | ${r.verdict.qualifies?'Verified':'No alert: '+(r.scanNote||'incomplete').replaceAll('|','/')} |`)];
await writeFile(`${outdir}/summary.md`,summary.join('\n'));
if(process.env.GITHUB_STEP_SUMMARY)await writeFile(process.env.GITHUB_STEP_SUMMARY,summary.join('\n')+'\n',{flag:'a'});
