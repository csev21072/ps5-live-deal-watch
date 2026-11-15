// Internal-only coverage accounting. A completed workflow or a loaded page
// is NOT proof that a retailer's orderable inventory was verified.
export function summarizeCoverage(records=[],discovery={coverage:[]},retailers=[]) {
  const unique=[...new Set(retailers)];
  const results=unique.map(retailer=>{
    const pages=records.filter(r=>r.retailer===retailer);
    const discoveryAttempt=(discovery.coverage??[]).find(x=>x.retailer===retailer);
    const unreadable=pages.filter(r=>r.source==='unreadable'||r.diagnostic?.status==='unreadable').length;
    const blocked=pages.filter(r=>r.blocked===true||r.diagnostic?.status==='blocked').length;
    const productIdentified=pages.filter(r=>r.source==='live-retailer-purchase-surface' &&
      (r.productEvidence?.productHeading||r.sonyFacts?.officialProductPage) &&
      r.blocked!==true).length;
    const verified=pages.filter(r=>r.verdict?.qualifies===true).length;
    const checkoutInspected=pages.filter(r=>r.probe?.cartEvidence||r.probe?.cartResearch).length;
    const missing=pages.length===0;
    const status=missing?'not-checked':
      verified>0?'verified-offer-observed':
      unreadable+blocked===pages.length?'all-pages-unreadable-or-blocked':
      unreadable>0||blocked>0?'partial-coverage':
      productIdentified===0?'no-product-confirmed':
      'product-pages-inspected-checkout-unverified';
    return {
      retailer,attemptedPages:pages.length,unreadablePages:unreadable,blockedPages:blocked,
      productIdentifiedPages:productIdentified,checkoutInspectedPages:checkoutInspected,
      verifiedOrderableOffers:verified,
      discoveryStatus:discoveryAttempt?.status??'not-checked',
      status
    };
  });
  return {
    checkedAt:new Date().toISOString(),
    expectedRetailers:unique.length,
    retailersAttempted:results.filter(x=>x.attemptedPages>0).length,
    retailersWithVerifiedOffer:results.filter(x=>x.verifiedOrderableOffers>0).length,
    allRetailersAttempted:results.every(x=>x.attemptedPages>0),
    allRetailersFullyVerified:false, // No negative checkout proof for every SKU/offer.
    checkoutVerificationIncomplete:results.some(x=>x.status!=='verified-offer-observed'),
    retailerResults:results
  };
}
