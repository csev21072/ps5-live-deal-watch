import {exactSkuInText,selectedFulfillmentMatches,exactItemPriceInText} from '../checkout/evidence-checks.mjs';
import {publicRetailerUrl} from './url.mjs';
// Research-only cart matching. Never creates checkoutEvidence or sets
// fulfillment.confirmed. Do not confuse unrelated cart items or subtotal with
// the selected console's price. A matching cart row is NOT an orderable checkout.
const price=/\$\s*[\d,]+(?:\.\d{2})?/g;
const normalize=s=>String(s??'').replace(/\s+/g,' ').trim();
export function expectedSkuFromProductUrl(url){
  try {
    const u=new URL(url);
    const path=u.pathname;
    const m=path.match(/\/(\d{5,})\.html$/);
    return m?m[1]:null;
  }catch{return null;}
}
export function inspectCartText({cartUrl,cartText,productUrl,productHeading,priceText,zip='85001'}){
  const result={
    status:'unverified',url:null,
    skuExpected:expectedSkuFromProductUrl(productUrl),
    skuFoundInCart:false,exactProductTitleFound:false,
    productPriceMatched:false,zipInShippingContext:false,
    blocked:false,unavailable:false,
    verifiedCheckout:false
  };
  let cart;
  try{cart=new URL(cartUrl);}catch{return {...result,status:'invalid-cart-url'};}
  let product;
  try{product=new URL(productUrl);}catch{return {...result,status:'invalid-product-url'};}
  if(cart.protocol!=='https:'||cart.hostname!==product.hostname||!/(?:cart|checkout)/i.test(cart.pathname))
    return {...result,status:'wrong-cart-origin'};
  result.url=publicRetailerUrl(cartUrl,product.hostname);
  const text=String(cartText??'');
  if(/captcha|verify you are human|access denied|press\s*&\s*hold/i.test(text))
    return {...result,status:'blocked',blocked:true};
  const heading=normalize(productHeading);
  const lines=text.split(/\r?\n/).map(normalize).filter(Boolean);
  const sku=result.skuExpected;
  const skuLine=sku?lines.findIndex(line=>exactSkuInText(line,sku)):-1;
  const titleLine=heading.length>=15?lines.findIndex(line=>line.includes(heading)):-1;
  const itemIndex=skuLine>=0?skuLine:titleLine;
  result.skuFoundInCart=skuLine>=0;
  result.exactProductTitleFound=titleLine>=0;
  if(itemIndex<0)return {...result,status:'item-not-found'};
  // Inspect a bounded row-like text window. Never match unrelated subtotal.
  const context=lines.slice(Math.max(0,itemIndex-2),Math.min(lines.length,itemIndex+5)).join(' | ').slice(0,500);
  // Do not persist raw cart rows: they may contain account or address data.
  const expectedPrices=[...String(priceText??'').matchAll(price)].map(m=>m[0].replace(/\s/g,''));
  const observedPrices=[...context.matchAll(price)].map(m=>m[0].replace(/\s/g,''));
  result.productPriceMatched=expectedPrices.length===1 && observedPrices.length===1 && exactItemPriceInText(context,Number(expectedPrices[0].replace('
  result.unavailable=/\b(not available|unavailable|sold out|out of stock)\b/i.test(context);
  // Require ZIP near a shipping/delivery label. A random ZIP in the cart is not proof.
  const shippingLines=lines.filter(line=>/\b(ship|shipping|deliver|delivery|arrives)\b/i.test(line));
  result.zipInShippingContext=shippingLines.some(line=>selectedFulfillmentMatches(line,zip));
  result.status=result.unavailable?'item-unavailable':result.productPriceMatched?'item-price-seen-not-checkout':'item-price-unverified';
  return result;
}
,'').replaceAll(',','')));
  result.unavailable=/\b(not available|unavailable|sold out|out of stock)\b/i.test(context);
  // Require ZIP near a shipping/delivery label. A random ZIP in the cart is not proof.
  const shippingLines=lines.filter(line=>/\b(ship|shipping|deliver|delivery|arrives)\b/i.test(line));
  result.zipInShippingContext=shippingLines.some(line=>line.includes(zip));
  result.status=result.unavailable?'item-unavailable':result.productPriceMatched?'item-price-seen-not-checkout':'item-price-unverified';
  return result;
}
