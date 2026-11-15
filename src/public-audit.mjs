import {publicRetailerUrl} from './evidence/url.mjs';

// Explicit allowlist for the PUBLIC audit branch. Raw browser evidence stays
// inside the short-lived Actions artifact, never in the public Git repository.
// No cart rows, shipping addresses, emails, seller text, arbitrary page text,
// exception strings, cookies, tokens or search-query URLs are published.
export function publicAudit(raw){
  if(!raw||!Array.isArray(raw.records))throw new Error('Invalid scan evidence');
  const records=raw.records.map(r=>{
    const out={
      id:String(r.id??'').slice(0,100),
      retailer:String(r.retailer??'').slice(0,50),
      kind:['disc','digital'].includes(r.kind)?r.kind:'unknown',
      url:publicRetailerUrl(r.url,r.host),
      checkedAt:r.checkedAt??null,
      source:['live-retailer-purchase-surface','unreadable'].includes(r.source)?r.source:'unknown',
      blocked:r.blocked===true,
      unavailable:r.unavailable===true,
      diagnostic:{status:String(r.diagnostic?.status??'unknown').slice(0,100)},
      price:Number.isFinite(r.price)?r.price:null,
      productEvidence:{
        editionHint:r.productEvidence?.editionHint??'unknown',
        storageHint:r.productEvidence?.storageHint??null,
        extraControllerHint:r.productEvidence?.extraControllerHint===true,
        productHeadingObserved:Boolean(r.productEvidence?.productHeading)
      },
      probe:{
        status:String(r.probe?.status??'not-run').slice(0,100),
        cartActionCount:Number.isInteger(r.probe?.cartActionCount)?r.probe.cartActionCount:0,
        enabledCartActions:Number.isInteger(r.probe?.enabledCartActions)?r.probe.enabledCartActions:0,
        fulfillmentNavigationCount:Number.isInteger(r.probe?.fulfillmentNavigationCount)?r.probe.fulfillmentNavigationCount:0,
        checkoutResearchObserved:Boolean(r.probe?.cartEvidence||r.probe?.cartResearch),
        verifiedPurchase:false
      },
      priceHint:{status:String(r.priceHint?.status??'not-run').slice(0,100)},
      sonyPrice:{status:String(r.sonyPrice?.status??'not-run').slice(0,100)},
      sonyFacts:{
        officialProductPage:r.sonyFacts?.officialProductPage===true,
        editionHint:r.sonyFacts?.editionHint??'unknown',
        storageHint:r.sonyFacts?.storageHint??null,
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
    retailer:String(x.retailer??'').slice(0,50),
    status:String(x.status??'unknown').slice(0,100),
    found:Number.isInteger(x.found)?x.found:0
  }));
  return {
    checkedAt:raw.checkedAt??null,
    zip:'85001',
    note:'Public status-only audit. No cart, checkout, address, account or raw page text.',
    discovery:{coverage:discoveryCoverage},
    coverage:raw.coverage??null,
    records
  };
}
