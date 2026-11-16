import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {publicRetailerUrl} from './evidence/url.mjs';
import {RETAILER_HOSTS} from './config.mjs';
import {candidateReadiness} from './candidates.mjs';
const safeStatus=value=>/^[a-z][a-z0-9-]{0,99}$/.test(String(value??''))?value:'unknown';
const safeRetailer=value=>Object.hasOwn(RETAILER_HOSTS,value)?value:'unknown';
const safeKind=value=>['disc','digital'].includes(value)?value:'unknown';
const safeStorage=value=>/^(825\s*GB|1\s*TB|2\s*TB)$/i.test(String(value??''))?value:null;

// Explicit allowlist for the PUBLIC audit branch. Raw browser evidence stays
// in memory during the run, never in the public Git repository or artifact.
// No cart rows, shipping addresses, emails, seller text, arbitrary page text,
// exception strings, cookies, tokens or search-query URLs are published.
export function publicAudit(raw){
  if(!raw||!Array.isArray(raw.records))throw new Error('Invalid scan evidence');
  const records=raw.records.map(r=>{
    const out={
      id:/^[a-z0-9-]{1,100}$/.test(String(r.id??''))?r.id:'unknown',
      retailer:safeRetailer(r.retailer),
      kind:safeKind(r.kind),
      url:publicRetailerUrl(r.url,r.host),
      checkedAt:r.checkedAt??null,
      source:['live-retailer-purchase-surface','unreadable'].includes(r.source)?r.source:'unknown',
      blocked:r.blocked===true,
      unavailable:r.unavailable===true,
      diagnostic:{status:safeStatus(r.diagnostic?.status)},
      price:Number.isFinite(r.price)?r.price:null,
      productEvidence:{
        editionHint:safeKind(r.productEvidence?.editionHint),
        storageHint:safeStorage(r.productEvidence?.storageHint),
        extraControllerHint:r.productEvidence?.extraControllerHint===true,
        productHeadingObserved:Boolean(r.productEvidence?.productHeading)
      },
      probe:{
        status:safeStatus(r.probe?.status??'not-run'),
        cartActionCount:Number.isInteger(r.probe?.cartActionCount)?r.probe.cartActionCount:0,
        enabledCartActions:Number.isInteger(r.probe?.enabledCartActions)?r.probe.enabledCartActions:0,
        fulfillmentNavigationCount:Number.isInteger(r.probe?.fulfillmentNavigationCount)?r.probe.fulfillmentNavigationCount:0,
        checkoutResearchObserved:Boolean(r.probe?.cartEvidence||r.probe?.cartResearch),
        verifiedPurchase:false
      },
      priceHint:{status:safeStatus(r.priceHint?.status??'not-run')},
      sonyPrice:{status:safeStatus(r.sonyPrice?.status??'not-run')},
      sonyFacts:{
        officialProductPage:r.sonyFacts?.officialProductPage===true,
        editionHint:safeKind(r.sonyFacts?.editionHint),
        storageHint:safeStorage(r.sonyFacts?.storageHint),
        slimModelHint:r.sonyFacts?.slimModelHint===true
      },
      verdict:{qualifies:r.verdict?.qualifies===true}
    };
    // Refuse to publish raw offer evidence if any unknown record type appears.
    if(!out.url && r.source==='live-retailer-purchase-surface')
      out.diagnostic.status='invalid-public-url';
    return out;
  });
  const discoveryCoverage=(raw.discovery?.coverage??[]).map(x=>({
    retailer:safeRetailer(x.retailer),
    status:safeStatus(x.status),
    found:Number.isInteger(x.found)?x.found:0
  }));
  return {
    checkedAt:raw.checkedAt??null,
    zip:'85001',
    note:'Public status-only audit. No cart, checkout, address, account or raw page text.',
    discovery:{coverage:discoveryCoverage},
    coverage:raw.coverage?{
      expectedRetailers:Number(raw.coverage.expectedRetailers)||0,
      retailersAttempted:Number(raw.coverage.retailersAttempted)||0,
      retailersWithVerifiedOffer:Number(raw.coverage.retailersWithVerifiedOffer)||0,
      allRetailersAttempted:raw.coverage.allRetailersAttempted===true,
      retailersWithoutVerifiedOffers:Number(raw.coverage.retailersWithoutVerifiedOffers)||0,
      retailerResults:(raw.coverage.retailerResults??[]).map(x=>({
        retailer:safeRetailer(x.retailer),status:safeStatus(x.status),
        attemptedPages:Number(x.attemptedPages)||0,
        unreadablePages:Number(x.unreadablePages)||0,
        blockedPages:Number(x.blockedPages)||0,
        productIdentifiedPages:Number(x.productIdentifiedPages)||0,
        checkoutInspectedPages:Number(x.checkoutInspectedPages)||0,
        verifiedOrderableOffers:Number(x.verifiedOrderableOffers)||0,
        discoveryStatus:safeStatus(x.discoveryStatus)
      }))
    }:null,
    records,
    candidateResearch:candidateReadiness(records)
  };
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw new Error('Usage: node src/public-audit.mjs input.json output.json');
  const raw=JSON.parse(await readFile(input,'utf8'));
  await writeFile(output,JSON.stringify(publicAudit(raw),null,2)+'\n');
  console.log('Saved status-only public audit without raw cart or browser text');
}
