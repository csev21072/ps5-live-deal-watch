import {ZIP, MAX_AGE_MS} from './config.mjs';
const invalidFulfillment = /\b(not available|unavailable|out of stock|sold out|select condition for availability|shipping unavailable|delivery unavailable|ship to home unavailable|cannot be shipped|currently unavailable)\b/i;
const validMethods = new Set(['ship-to-home','local-pickup']);
const money = /\$\s*([\d,]+(?:\.\d{2})?)/;
export function priceFromText(value) {
  const matches = [...String(value ?? '').matchAll(/\$\s*([\d,]+(?:\.\d{2})?)/g)];
  return matches.length === 1 ? Number(matches[0][1].replaceAll(',','')) : null;
}
export function evaluate(record, now = Date.now()) {
  const reasons=[];
  const reject=(why)=>reasons.push(why);
  if (!record || !record.url || !record.host) return {qualifies:false,reasons:['missing retailer URL/host']};
  let u;
  try {u=new URL(record.url);} catch {reject('invalid URL');}
  if (!u || u.protocol!=='https:' || u.hostname!==record.host) reject('not the exact HTTPS retailer-owned host');
  if (record.source !== 'live-retailer-purchase-surface') reject('not live retailer purchase evidence');
  if (record.unavailable===true) reject('retailer reported unavailable');
  if (!Number.isFinite(Date.parse(record.checkedAt)) || Math.abs(now-Date.parse(record.checkedAt))>MAX_AGE_MS) reject('missing or stale verification timestamp');
  if (!['disc','digital'].includes(record.kind)) reject('unknown console edition');
  if (!record.exactModel || !record.skuOrBundle) reject('exact model/SKU/bundle not identified');
  if (/\b(ps5 pro|playstation\s*5\s*pro|ps4|playstation\s*4)\b/i.test(record.exactModel??'') || (!/\bslim\b/i.test(record.exactModel??'') && record.slimModelEvidence!==true)) reject('PS5 Slim model not independently confirmed');
  if (record.condition !== 'NEW' || !/\bnew\b/i.test(record.conditionText ?? '') || /\b(not\s+new|pre.?owned|refurbished|used|open.?box)\b/i.test(record.conditionText ?? '')) reject('NEW condition not explicitly verified');
  if (!record.seller || !record.sellerText || !record.shipper) reject('seller and shipper not explicitly verified');
  if (!record.sellerText || !record.shipperText || !String(record.sellerText).toLowerCase().includes(String(record.seller??'').toLowerCase()) || !String(record.shipperText).toLowerCase().includes(String(record.shipper??'').toLowerCase())) reject('seller/shipper identities conflict with retailer-owned evidence text');
  if (['Amazon','Walmart'].includes(record.retailer) && (!record.sellerText || !record.shipperText)) reject('marketplace seller/shipper not confirmed');
  if (record.retailer==='Amazon' || record.retailer==='Walmart') {
    const expected=record.retailer==='Amazon'?/^(amazon\.com|amazon)$/i:/^(walmart|walmart\.com)$/i;
    const firstParty=expected.test(String(record.seller??'').trim()) && expected.test(String(record.shipper??'').trim());
    if(!firstParty && !(record.marketplaceSellerApproved===true && record.marketplaceReputationEvidence))
      reject('third-party marketplace offer not independently approved and reputation-verified');
  }
  if (!Number.isInteger(record.controllers) || record.controllers<1) reject('controller count not verified');
  if (record.controllers>1 && (!/dualSense/i.test(record.extraControllerEvidence ?? '') || !/(extra|additional|second|two|2)/i.test(record.extraControllerEvidence ?? '') || !/(Sony|genuine)/i.test(record.extraControllerEvidence ?? ''))) reject('extra genuine DualSense count and identity not explicitly verified');
  if (!record.storage || !/\b(825\s*gb|1\s*tb|2\s*tb)\b/i.test(record.storage)) reject('storage not verified');
  if (typeof record.discDrive !== 'boolean' || (record.kind==='disc')!==record.discDrive) reject('disc drive not verified or inconsistent');
  if (!Number.isFinite(record.price) || record.price<=0 || !record.priceText || priceFromText(record.priceText)!==record.price) reject('exact current displayed price not verified');
  const f=record.fulfillment;
  if (!f || f.confirmed!==true || !validMethods.has(f.method) || f.zip!==ZIP || !f.text || !f.locationText || !f.locationText.includes(ZIP) || !f.cartOrCheckoutConfirmed) reject('Phoenix fulfillment not confirmed in live orderable flow');
  if (f && (invalidFulfillment.test(f.text ?? '') || invalidFulfillment.test(f.locationText ?? ''))) reject('retailer shows unavailable fulfillment');
  const checkout=record.checkoutEvidence;
  if (!checkout || checkout.orderable!==true || checkout.skuOrBundle!==record.skuOrBundle
      || checkout.zip!==ZIP || priceFromText(checkout.priceText)!==record.price
      || !checkout.fulfillmentText || !checkout.fulfillmentText.includes(ZIP)
      || !Number.isFinite(Date.parse(checkout.observedAt))
      || Math.abs(now-Date.parse(checkout.observedAt))>MAX_AGE_MS) {
    reject('matching live retailer cart/checkout SKU, price and Phoenix orderability not proven');
  }
  let checkoutUrl;
  try{checkoutUrl=new URL(checkout?.url);}catch{}
  if(!checkoutUrl || checkoutUrl.protocol!=='https:' || checkoutUrl.hostname!==record.host
      || !/(cart|checkout|purchase)/i.test(checkoutUrl.pathname))
    reject('retailer-owned cart/checkout URL not verified');
  if(checkout && invalidFulfillment.test(checkout.fulfillmentText??''))
    reject('cart/checkout shows unavailable fulfillment');
  if (record.conflictingEvidence===true) reject('unresolved contradictory evidence');
  if (record.requiresLogin===true || record.blocked===true) reject('login/CAPTCHA/blocked');
  const gameCredit = record.gameCredit ?? 0;
  const gameEvidence=record.gameCreditEvidence;
  const validGameValue=gameEvidence && typeof gameEvidence==='object'
    && Number.isFinite(gameEvidence.currentSalePrice)
    && gameEvidence.currentSalePrice>=gameCredit
    && gameCredit<=40 // Conservative cap for included game value; never use MSRP.
    && gameEvidence.currentSalePrice>0
    && Number.isFinite(Date.parse(gameEvidence.observedAt))
    && Math.abs(now-Date.parse(gameEvidence.observedAt))<=7*24*60*60*1000
    && /^https:\/\//i.test(gameEvidence.sourceUrl??'')
    && gameEvidence.saleType==='current-retail-sale';
  if (!Number.isFinite(gameCredit) || gameCredit<0 || (gameCredit>0 && !validGameValue)) reject('unsubstantiated or stale game/accessory sale valuation');
  // Only one additional genuine DualSense may be credited by this policy.
  // A larger count requires a separately reviewed valuation model.
  if (record.controllers>2) reject('more than two controllers requires manual bundle valuation');
  const extraControllerCredit = record.controllers===2?55:0;
  const effective = Number.isFinite(record.price) ? record.price-extraControllerCredit-gameCredit : null;
  if (effective!==null && effective>(record.kind==='disc'?500:450)) reject('effective price above target');
  return {qualifies:reasons.length===0,reasons,effectivePrice:effective,extraControllerCredit,gameCredit};
}
