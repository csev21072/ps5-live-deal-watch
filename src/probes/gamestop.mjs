// GameStop guest-cart research probe. It never authorizes a purchase alert.
// A cart confirmation without verified NEW condition, seller, exact SKU, price,
// and Phoenix fulfillment is still UNKNOWN. No login or checkout is attempted.
export function fulfillmentEvidence(text) {
  const lines=String(text??'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const found=[];
  for(let i=0;i<lines.length;i++){
    if(!/^(ship to home|pick up in.store|pickup|same day delivery)\b/i.test(lines[i]))continue;
    const quote=lines.slice(i,i+3).join(' | ').slice(0,220);
    if(!found.includes(quote))found.push(quote);
    if(found.length===6)break;
  }
  return found;
}
export async function probeGameStop(page, product, diagnostic) {
  if(product.retailer!=='GameStop')return {status:'not-applicable'};
  if(diagnostic.status!=='candidate-needs-fulfillment-verification')
    return {status:'skipped',reason:diagnostic.status};
  const title=(await page.title().catch(()=>''))||'';
  if(!/playstation|ps5/i.test(title))
    return {status:'product-not-confirmed'};
  const before=(await page.locator('body').innerText({timeout:5000}).catch(()=>''))||'';
  const observedFulfillment=fulfillmentEvidence(before);
  const shippingUnavailable=/ship to home\s*[:\-]?\s*not available/i.test(before);
  const pickupUnavailable=/(?:pick up in.store|pickup)\s*[:\-]?\s*not available/i.test(before);
  if(shippingUnavailable && pickupUnavailable)
    return {status:'all-fulfillment-unavailable',observedFulfillment};
  if(shippingUnavailable)
    return {status:'shipping-unavailable-pickup-unverified',observedFulfillment};
  if(/\bout of stock\b/i.test(before))
    return {status:'stock-unavailable-pickup-unverified',observedFulfillment};
  // A location selector may be absent or require a full address/sign-in.
  // Never assume a browser's geo setting proves Phoenix shipping.
  const zipField=page.locator('input[placeholder*="ZIP" i],input[aria-label*="zip" i],input[name*="postal" i]');
  let location='unconfirmed';
  if(await zipField.count().catch(()=>0)===1){
    try {
      const field=zipField.first();
      if(await field.isVisible()){
        await field.fill('85001',{timeout:3000});
        await field.press('Enter',{timeout:3000});
        await page.waitForTimeout(600);
        location='entered-85001-not-yet-confirmed';
      }
    }catch{location='location-entry-blocked';}
  }
  const add=page.getByRole('button',{name:/^add to cart$/i}).first();
  if(!(await add.isVisible().catch(()=>false)) || !(await add.isEnabled().catch(()=>false)))
    return {status:'cart-not-orderable',location,observedFulfillment};
  try {
    await add.click({timeout:5000});
    await page.waitForTimeout(750);
    const after=(await page.locator('body').innerText({timeout:5000}).catch(()=>''))||'';
    if(/captcha|robot or human|press\s*&\s*hold|access denied/i.test(after))
      return {status:'blocked-after-cart',location,observedFulfillment};
    const cartVisible=/added to (your )?cart|view cart|shopping cart/i.test(after);
    if(!cartVisible)
      return {status:'cart-result-unconfirmed',location,observedFulfillment,verifiedPurchase:false};
    // This is a research-only guest-cart inspection. A cart page alone cannot
    // prove checkout availability, and this never sets checkoutEvidence.
    try{
      const viewCart=page.getByRole('link',{name:/view cart|shopping cart/i}).first();
      if(await viewCart.isVisible().catch(()=>false))
        await viewCart.click({timeout:6000});
      else
        await page.goto('https://www.gamestop.com/cart/',{waitUntil:'domcontentloaded',timeout:12000});
      const cartBody=(await page.locator('body').innerText({timeout:6000}).catch(()=>''))||'';
      const cartUrl=page.url();
      if(new URL(cartUrl).hostname!=='www.gamestop.com')
        return {status:'cart-redirected-off-retailer',location,verifiedPurchase:false};
      if(/captcha|robot or human|press\s*&\s*hold|access denied/i.test(cartBody))
        return {status:'cart-blocked',location,verifiedPurchase:false};
      const cartEvidence={
        url:cartUrl,
        checkedAt:new Date().toISOString(),
        phoenixZipVisible:/\b85001\b/.test(cartBody),
        productMentioned:/playstation\s*5|ps5/i.test(cartBody),
        priceMentions:[...cartBody.matchAll(/\$\s*[\d,]+(?:\.\d{2})?/g)].slice(0,4).map(x=>x[0]),
        fulfillmentText:fulfillmentEvidence(cartBody)
      };
      return {status:'cart-inspected-unverified',location,observedFulfillment,cartEvidence,verifiedPurchase:false};
    }catch(e){
      return {status:'cart-navigation-blocked',location,observedFulfillment,verifiedPurchase:false,reason:String(e).slice(0,120)};
    }
  } catch(e) {
    return {status:'cart-click-blocked',location,observedFulfillment,reason:String(e).slice(0,120)};
  }
}
