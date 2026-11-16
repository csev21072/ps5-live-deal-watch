// Shared, pure matching primitives. A substring is never enough to prove
// exact SKU, ZIP, or a selected cart line. No I/O or browser interactions.
const escapeRegex=value=>[...String(value)].map(ch=>'\\^$.*+?()[]{}|'.includes(ch)?'\\'+ch:ch).join('');
export function exactSkuInText(text,sku){
  if(typeof text!=='string'||typeof sku!=='string'||sku.trim().length<5)return false;
  const value=sku.trim();
  return new RegExp('(?:^|[^A-Za-z0-9])'+escapeRegex(value)+'(?=$|[^A-Za-z0-9])','i').test(text);
}
export function exactZipInText(text,zip='85001'){
  if(typeof text!=='string'||!/^\d{5}$/.test(zip))return false;
  return new RegExp('(?:^|[^0-9])'+zip+'(?=$|[^0-9])').test(text);
}
export function selectedFulfillmentMatches(text,zip='85001'){
  if(typeof text!=='string'||text.length>1000)return false;
  return exactZipInText(text,zip) && /\b(ship|shipping|deliver|delivery|pickup|pick up|collect)\b/i.test(text)
    && !/\b(not available|unavailable|sold out|out of stock|disabled|cannot ship|cannot deliver|not eligible|ineligible|not offered|not supported|not serviceable|not shippable|no delivery|no pickup|no shipping|restricted|unable to ship|unable to deliver|not deliverable|not orderable|delivery unavailable|pickup unavailable)\b/i.test(text);
}
export function exactItemPriceInText(text,amount){
  if(typeof text!=='string'||!Number.isFinite(amount)||amount<=0)return false;
  const prices=[...text.matchAll(/\$\s*([\d,]+(?:\.\d{2})?)(?!\d)/g)]
    .map(m=>Number(m[1].replaceAll(',','')));
  return prices.length===1 && Math.round(prices[0]*100)===Math.round(amount*100);
}
