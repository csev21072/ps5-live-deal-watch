import {publicRetailerUrl} from '../evidence/url.mjs';
import {priceFromText} from '../rules.mjs';
import {inspectCartText} from '../evidence/cart.mjs';
import {captureCartControls} from '../checkout/cart-controls.mjs';

// Research-only guest-cart probe for official NEW console product pages.
// It never logs in, purchases, submits checkout, or marks fulfillment verified.
export async function probeSonyCart(page,product,sonyFacts,priceText,sonyPriceEvidence=null) {
  const result={status:'unverified',verifiedPurchase:false,checkoutVerified:false};
  if(product.retailer!=='PlayStation Direct')return {...result,status:'not-applicable'};
  if(!sonyFacts?.officialProductPage || sonyFacts.status!=='product-facts-observed-checkout-unverified'
    || !sonyFacts.slimModelHint || sonyFacts.editionHint!==product.kind)
    return {...result,status:'product-facts-incomplete'};
  if(sonyPriceEvidence?.status!=='retailer-price-widget-observed' ||
     sonyPriceEvidence.priceText!==priceText)
    return {...result,status:'retailer-price-widget-unverified'};
  const price=priceFromText(priceText);
  const threshold=product.kind==='disc'?500:450;
  if(price===null)return {...result,status:'price-not-readable'};
  if(price>threshold)return {...result,status:'price-above-target'};
  try {
    const button=page.getByRole('button',{name:/^add to cart$/i});
    if(await button.count().catch(()=>0)!==1)
      return {...result,status:'cart-button-not-unique'};
    const add=button.first();
    if(!(await add.isVisible().catch(()=>false))||!(await add.isEnabled().catch(()=>false)))
      return {...result,status:'cart-button-unavailable'};
    await add.click({timeout:6000});
    await page.waitForTimeout(600);
    const body=(await page.locator('body').innerText({timeout:5000}).catch(()=>''));
    if(/captcha|verify you are human|access denied|press\s*&\s*hold/i.test(body))
      return {...result,status:'blocked-after-cart'};
    if(!/added to (your )?cart|view cart|shopping cart/i.test(body))
      return {...result,status:'cart-add-unconfirmed'};
    const cartLink=page.getByRole('link',{name:/view cart|shopping cart/i}).first();
    if(await cartLink.isVisible().catch(()=>false))
      await cartLink.click({timeout:6000});
    else
      await page.goto('https://direct.playstation.com/en-us/cart',{waitUntil:'domcontentloaded',timeout:15000});
    const cartUrl=page.url();
    if(new URL(cartUrl).hostname!=='direct.playstation.com')
      return {...result,status:'cart-redirected-off-retailer'};
    const cartText=(await page.locator('body').innerText({timeout:6000}).catch(()=>''));
    if(/captcha|verify you are human|access denied/i.test(cartText))
      return {...result,status:'cart-blocked'};
    const domControls=await captureCartControls(page,{productName:sonyFacts.productHeading,price});
    const match=inspectCartText({
      cartUrl,cartText,productUrl:product.url,
      productHeading:sonyFacts.productHeading,priceText
    });
    return {...result,status:'cart-inspected-unverified',
      cartResearch:{
        url:publicRetailerUrl(cartUrl,'direct.playstation.com'),checkedAt:new Date().toISOString(),
        itemMatch:match,
        domControls,
        // Never expose cookies, account details, full cart text or addresses.
        productHeading:sonyFacts.productHeading,
        observedPrice:price
      }
    };
  }catch(e){
    return {...result,status:'cart-interaction-blocked',reason:String(e).slice(0,140)};
  }
}
