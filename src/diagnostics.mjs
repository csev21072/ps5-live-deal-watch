// Read-only diagnostics. These are never purchase verification or alerts.
const BLOCKERS = [
  /press\s*&\s*hold to confirm/i,
  /robot or human/i,
  /verify you are human/i,
  /captcha/i,
  /access denied/i,
  /something went wrong/i
];
const UNAVAILABLE = [
  /ship to home\s*[:\-]?\s*not available/i,
  /same day delivery\s*[:\-]?\s*not available/i,
  /\bout of stock\b/i,
  /\bsold out\b/i,
  /\bcurrently unavailable\b/i,
  /\bunavailable online\b/i
];
export function extractVisibleSignals({body='',title='',priceText=''}, product) {
  const text=String(body);
  const productTitle=String(title);
  const blocked=BLOCKERS.some(re=>re.test(text.slice(0,12000)));
  const unavailable=UNAVAILABLE.some(re=>re.test(text));
  const matchedBrand=/playstation|\bps5\b/i.test(productTitle+' '+text.slice(0,1500));
  const priceVisible=/\$\s*[\d,]+(?:\.\d{2})?/.test(priceText);
  let status='candidate-needs-fulfillment-verification';
  if(blocked) status='blocked';
  else if(!matchedBrand) status='product-not-confirmed';
  else if(unavailable) status='unavailable';
  else if(!priceVisible) status='price-unreadable';
  const evidence=[];
  for(const re of [...BLOCKERS,...UNAVAILABLE]){
    const match=re.exec(text);
    if(match){const start=Math.max(0,match.index-65),end=Math.min(text.length,match.index+match[0].length+90);
      const quote=text.slice(start,end).replace(/\s+/g,' ').trim();
      if(quote && !evidence.includes(quote))evidence.push(quote);
    }
  }
  return {status,blocked,unavailable,matchedBrand,priceVisible,evidence:evidence.slice(0,3),productId:product?.id??null};
}
export function summarize(records) {
  const groups={};
  for(const record of records){
    const key=record.diagnostic?.status??'unreadable';
    groups[key]=(groups[key]??0)+1;
  }
  return {attempted:records.length,retailersAttempted:[...new Set(records.map(r=>r.retailer))],statusCounts:groups,confirmedPurchaseOffers:records.filter(r=>r.verdict?.qualifies).length};
}
