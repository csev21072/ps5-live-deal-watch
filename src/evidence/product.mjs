// Conservative research-only product evidence. Never sets fulfillment.confirmed,
// cartOrCheckoutConfirmed, checkoutEvidence or any positive purchase verdict.
// Inputs are a public, unauthenticated retailer page's visible text and DOM labels.
const normalize = value => String(value??'').replace(/\s+/g,' ').trim();
const pricePattern = /\$\s*[\d,]+(?:\.\d{2})?/g;
const unavailable = /\b(not available|unavailable|sold out|out of stock|currently unavailable)\b/i;
export function summarizeProductEvidence(observed,product) {
  const title=normalize(observed.title).slice(0,200);
  const headings=(observed.headings??[]).map(normalize).filter(Boolean).slice(0,8);
  const labels=(observed.labels??[]).map(normalize).filter(Boolean).slice(0,30);
  const body=String(observed.body??'');
  const lines=body.split(/\r?\n/).map(normalize).filter(Boolean);
  const exactKeywords=/\b(PlayStation\s*5|PS5|DualSense|disc edition|digital edition|storage|825\s*GB|1\s*TB|2\s*TB|condition|sold by|shipped by|seller|SKU|item #|model #|ship to home|pick up in.store|same day delivery|shipping to|delivery to|85001)\b/i;
  const highlights=[];
  for (let i=0;i<lines.length && highlights.length<24;i++){
    if(!exactKeywords.test(lines[i]))continue;
    // Only the relevant line and one following line, not entire site text.
    const quote=lines.slice(i,i+2).join(' | ').slice(0,220);
    if(!highlights.includes(quote))highlights.push(quote);
  }
  const priceText=normalize(observed.priceText).slice(0,80);
  const prices=[...priceText.matchAll(pricePattern)].map(m=>m[0]);
  const selectedOfferPrice=prices.length===1?prices[0]:null;
  const itemTitle=headings.find(h=>/playstation\s*5|\bps5\b/i.test(h))??null;
  const headingLine=itemTitle?lines.findIndex(line=>line.includes(itemTitle)):-1;
  const productLines=headingLine>=0?lines.slice(headingLine,headingLine+60):[];
  const skuMatch=productLines.join(' | ').match(/\b(?:SKU|item\s*#|model\s*#)\s*[:#]?\s*([A-Za-z0-9-]{5,})\b/i);
  const skuHint=skuMatch?skuMatch[1]:null;
  const description=productLines.join(' ');
  const extraControllerHint=/\b(?:2|two)\s+(?:genuine\s+Sony\s+)?(?:DualSense\s+)?(?:wireless\s+)?controllers\b|\b(?:extra|additional|second)\s+(?:Sony\s+)?DualSense\b/i.test(description);
  const storageHint=(itemTitle??'').match(/\b(?:825\s*GB|1\s*TB|2\s*TB)\b/i)?.[0]??null;
  const modelConfirmed=!!itemTitle && /\b(playstation\s*5|ps5)\b/i.test(itemTitle);
  const digital=/\b(digital|all.digital)\b/i.test(itemTitle??'');
  const disc=/\b(disc|disk)\b/i.test(itemTitle??'');
  const edition=(!modelConfirmed||digital===disc)?'unknown':digital?'digital':'disc';
  // These are hints for future adapter development, NOT validated facts.
  return {
    retailer:product.retailer,productId:product.id,
    pageTitle:title,productHeading:itemTitle,editionHint:edition,
    priceSelectorText:priceText,selectedOfferPrice,
    skuHint,extraControllerHint,storageHint,
    visibleLabels:labels,highlights,
    containsUnscopedUnavailableText:highlights.some(x=>unavailable.test(x)),
    conditionVerified:false,sellerVerified:false,skuVerified:false,
    phoenixCheckoutVerified:false,verificationLevel:'diagnostic-only'
  };
}
