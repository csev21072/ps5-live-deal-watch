// Read-only purchase-control diagnostics for retailers without a cart adapter.
// Never clicks, logs in, reserves stock, or produces verified purchase evidence.
const cartActionLabel=/\b(add to cart|buy now|add to bag)\b/i;
const fulfillmentNavigationLabel=/\b(check availability|pick up|pickup|ship to home|shipping|delivery)\b/i;
const blockedLabel=/\b(sold out|out of stock|unavailable|not available)\b/i;
export function classifyProductControls(observation={},product={}) {
  const controls=Array.isArray(observation.controls)?observation.controls:[];
  const buttons=controls.filter(x=>cartActionLabel.test(x.label??''));
  const fulfillmentControls=controls.filter(x=>fulfillmentNavigationLabel.test(x.label??'')&&!cartActionLabel.test(x.label??''));
  const available=buttons.filter(x=>x.disabled===false && !blockedLabel.test(x.label??''));
  const conditionControls=controls.filter(x=>/\b(new|used|pre.?owned|refurbished|open.?box)\b/i.test(x.label??''));
  const selected=conditionControls.filter(x=>x.selected===true);
  const selectedNew=selected.length===1 && /^\s*new\s*$/i.test(selected[0].label??'');
  const editionConfirmed=observation.editionHint===product.kind;
  return {
    status:!editionConfirmed?'edition-not-confirmed':
      buttons.length===0?(fulfillmentControls.length?'fulfillment-controls-only':'cart-action-not-found'):
      available.length===0?'cart-action-disabled':
      'cart-action-enabled-unverified',
    retailer:product.retailer??null,
    productId:product.id??null,
    editionConfirmed,
    cartActionCount:buttons.length,
    enabledCartActions:available.length,
    fulfillmentNavigationCount:fulfillmentControls.length,
    newConditionSelected:selectedNew,
    // Never persist raw labels: purchase widgets can include account details.
    verifiedPurchase:false,
    checkoutVerified:false
  };
}
export async function inspectProductControls(page,product,productEvidence) {
  try{
    const observed=await page.evaluate(()=>{
      const visible=el=>!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
      const root=document.querySelector('main')||document.querySelector('[role="main"]')||document;
      const controls=[...root.querySelectorAll('button,[role="button"],input[type="submit"],[role="radio"],input[type="radio"]')]
        .filter(visible).slice(0,250).map(el=>({
          label:(el.innerText||el.getAttribute('aria-label')||el.getAttribute('value')||el.closest('label')?.innerText||'').replace(/\s+/g,' ').trim().slice(0,120),
          disabled:el.matches(':disabled')||el.getAttribute('aria-disabled')==='true',
          selected:el.checked===true||el.getAttribute('aria-checked')==='true'||el.getAttribute('aria-pressed')==='true'
        }));
      return {controls};
    });
    return classifyProductControls({...observed,editionHint:productEvidence?.editionHint},product);
  }catch(e){
    return {status:'purchase-controls-unreadable',retailer:product.retailer,productId:product.id,
      verifiedPurchase:false,checkoutVerified:false};
  }
}
