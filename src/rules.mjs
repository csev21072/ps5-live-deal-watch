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
  if (record.condition !== 'NEW' || !/\bnew\b/i.test(record.conditionText ?? '')) reject('NEW condition not explicitly verified');
  if (!record.seller || !record.sellerText || !record.shipper) reject('seller and shipper not explicitly verified');
  if (['Amazon','Walmart'].includes(record.retailer) && (!record.sellerText || !record.shipperText)) reject('marketplace seller/shipper not confirmed');
  if (!Number.isInteger(record.controllers) || record.controllers<1) reject('controller count not verified');
  if (record.controllers>1 && !/dualSense/i.test(record.extraControllerEvidence ?? '')) reject('extra genuine DualSense not explicitly verified');
  if (!record.storage || !/\b(825\s*gb|1\s*tb|2\s*tb)\b/i.test(record.storage)) reject('storage not verified');
  if (typeof record.discDrive !== 'boolean' || (record.kind==='disc')!==record.discDrive) reject('disc drive not verified or inconsistent');
  if (!Number.isFinite(record.price) || record.price<=0 || !record.priceText || priceFromText(record.priceText)!==record.price) reject('exact current displayed price not verified');
  const f=record.fulfillment;
  if (!f || f.confirmed!==true || !validMethods.has(f.method) || f.zip!==ZIP || !f.text || !f.locationText || !f.locationText.includes(ZIP) || !f.cartOrCheckoutConfirmed) reject('Phoenix fulfillment not confirmed in live orderable flow');
  if (f && (invalidFulfillment.test(f.text ?? '') || invalidFulfillment.test(f.locationText ?? ''))) reject('retailer shows unavailable fulfillment');
  if (record.conflictingEvidence===true) reject('unresolved contradictory evidence');
  if (record.requiresLogin===true || record.blocked===true) reject('login/CAPTCHA/blocked');
  const gameCredit = record.gameCredit ?? 0;
  if (!Number.isFinite(gameCredit) || gameCredit<0 || (gameCredit>0 && !record.gameCreditEvidence)) reject('unsubstantiated game/accessory valuation');
  const extraControllerCredit = Math.max(0,(record.controllers ?? 1)-1)*55;
  const effective = Number.isFinite(record.price) ? record.price-extraControllerCredit-gameCredit : null;
  if (effective!==null && effective>(record.kind==='disc'?500:450)) reject('effective price above target');
  return {qualifies:reasons.length===0,reasons,effectivePrice:effective,extraControllerCredit,gameCredit};
}
