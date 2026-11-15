// GameStop guest-cart research probe. It never authorizes a purchase alert.
// A cart confirmation without verified NEW condition, seller, exact SKU, price,
// and Phoenix fulfillment is still UNKNOWN. No login or checkout is attempted.
export async function probeGameStop(page, product, diagnostic) {
  if(product.retailer!=='GameStop')return {status:'not-applicable'};
  if(diagnostic.status!=='candidate-needs-fulfillment-verification')
    return {status:'skipped',reason:diagnostic.status};
  const title=(await page.title().catch(()=>''))||'';
  if(!/playstation|ps5/i.test(title))
    return {status:'product-not-confirmed'};
  const before=(await page.locator('body').innerText({timeout:5000}).catch(()=>''))||'';
  const shippingUnavailable=/ship to home\s*[:\-]?\s*not available/i.test(before);
  const pickupUnavailable=/(?:pick up in.store|pickup)\s*[:\-]?\s*not available/i.test(before);
  if(shippingUnavailable && pickupUnavailable)
    return {status:'all-fulfillment-unavailable'};
  if(shippingUnavailable)
    return {status:'shipping-unavailable-pickup-unverified'};
  if(/\bout of stock\b/i.test(before))
    return {status:'stock-unavailable-pickup-unverified'};
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
    return {status:'cart-not-orderable',location};
  try {
    await add.click({timeout:5000});
    await page.waitForTimeout(750);
    const after=(await page.locator('body').innerText({timeout:5000}).catch(()=>''))||'';
    if(/captcha|robot or human|press\s*&\s*hold|access denied/i.test(after))
      return {status:'blocked-after-cart',location};
    const cartVisible=/added to (your )?cart|view cart|shopping cart/i.test(after);
    return {status:cartVisible?'cart-action-observed-needs-checkout':'cart-result-unconfirmed',location,
      // Deliberately no verified price, seller or fulfillment claims.
      verifiedPurchase:false};
  } catch(e) {
    return {status:'cart-click-blocked',location,reason:String(e).slice(0,120)};
  }
}
