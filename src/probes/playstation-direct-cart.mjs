import {publicRetailerUrl} from '../evidence/url.mjs';
import {priceFromText} from '../rules.mjs';
import {inspectCartText} from '../evidence/cart.mjs';
import {captureSonyCartControls} from './sony-cart-controls.mjs';

// Research-only guest-cart probe for official NEW console product pages.
// It never logs in, purchases, submits checkout, or marks fulfillment verified.
export async function probeSonyCart(page,product,sonyFacts,priceText,sonyPriceEvidence=null,options={}) {
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
  if(price>threshold && options.researchOnly!==true)return {...result,status:'price-above-target'};
  if(price>800)return {...result,status:'research-price-above-ceiling'};
  try {
    // Observed 2026-11-19: accessory recommendations have their own Add buttons.
    // Bind the action to the product hero containing the exact console heading.
    const hero=page.locator('.productHero-info').filter({has:page.getByRole('heading',{level:1,name:sonyFacts.productHeading,exact:true})});
    if(await hero.count().catch(()=>0)!==1)return {...result,status:'product-hero-not-unique'};
    const button=hero.getByRole('button',{name:/^add to cart$/i});
    if(await button.count().catch(()=>0)!==1)
      return {...result,status:'cart-button-not-unique'};
    const add=button.first();
    if(!(await add.isVisible().catch(()=>false))||!(await add.isEnabled().catch(()=>false)))
      return {...result,status:'cart-button-unavailable'};
    const sku=await add.getAttribute('data-product-code').catch(()=>null);
    if(!/^[0-9]{8,12}$/.test(sku??''))return {...result,status:'product-sku-unreadable'};
    await add.click({timeout:6000});
    // Wait for the actual mini-cart control, not a fixed 600ms delay.
    const cartReview=page.getByRole('button',{name:'Edit and Checkout',exact:true});
    await cartReview.waitFor({state:'visible',timeout:8000}).catch(()=>{});
    const body=(await page.locator('body').innerText({timeout:5000}).catch(()=>''));
    if(/captcha|verify you are human|access denied|press\s*&\s*hold/i.test(body))
      return {...result,status:'blocked-after-cart'};
    const reviewVisible=await cartReview.count().catch(()=>0)===1 && await cartReview.isVisible().catch(()=>false);
    // The hosted browser may not render the slide-out cart. Its absence does
    // not prove addition or failure: inspect the live-observed cart route.
    const href=reviewVisible?await cartReview.getAttribute('href'):'/en-us/checkout?tab=cart';
    const reviewUrl=new URL(href??'',product.url);
    // This observed route is the CART review tab; never navigate to shipping/payment.
    if(reviewUrl.origin!=='https://direct.playstation.com'||reviewUrl.pathname!=='/en-us/checkout'||
       reviewUrl.search!=='?tab=cart'||reviewUrl.hash)
      return {...result,status:'cart-review-url-unexpected'};
    await page.goto(reviewUrl.href,{waitUntil:'domcontentloaded',timeout:15000});
    const cartUrl=page.url();
    if(cartUrl!==reviewUrl.href)return {...result,status:'cart-redirected-off-retailer'};
    await page.locator('.cart-physical-item').first().waitFor({state:'visible',timeout:8000}).catch(()=>{});
    const cartText=(await page.locator('body').innerText({timeout:6000}).catch(()=>''));
    if(/captcha|verify you are human|access denied/i.test(cartText))
      return {...result,status:'cart-blocked'};
    const domControls=await captureSonyCartControls(page,{productName:sonyFacts.productHeading,price,sku});
    const match=inspectCartText({
      cartUrl,cartText,productUrl:product.url,
      productHeading:sonyFacts.productHeading,priceText
    });
    return {...result,status:domControls.matchingRows?.length===1?'cart-inspected-unverified':'cart-inspected-item-unconfirmed',
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

