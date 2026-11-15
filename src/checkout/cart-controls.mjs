import {exactSkuInText,selectedFulfillmentMatches} from './evidence-checks.mjs';
// Read-only cart DOM capture for retailer-specific adapter development.
// Never enters personal information, clicks checkout, or marks an offer verified.
export function assessCartControls(observation={},expected={}) {
  const rows=Array.isArray(observation.rows)?observation.rows:[];
  const sku=String(expected.sku??'').trim();
  const name=String(expected.productName??'').replace(/\s+/g,' ').trim().toLowerCase();
  const matches=rows.filter(row=>{
    const text=String(row.text??'').replace(/\s+/g,' ').trim().toLowerCase();
    return sku.length>=5?exactSkuInText(text,sku):name.length>=15&&text.includes(name);
  });
  const selectedShipping=(observation.fulfillmentOptions??[]).filter(x=>x.selected===true);
  const missing=[];
  if(matches.length!==1)missing.push('exactly one selected console cart row');
  if(!observation.checkoutControl?.enabled)missing.push('enabled checkout control');
  if(selectedShipping.length!==1)missing.push('unambiguous selected shipping/pickup method');
  if(!selectedShipping.some(x=>selectedFulfillmentMatches(x.text,'85001')))
    missing.push('Phoenix 85001 explicitly shown in selected fulfillment');
  if(!matches.some(x=>/\bnew\b/i.test(x.text??'') && !/\b(used|pre.?owned|refurbished|open.?box)\b/i.test(x.text??'')))
    missing.push('selected NEW condition in matching item row');
  return {
    status:missing.length===0?'research-fields-observed-needs-live-review':'incomplete-cart-controls',
    missing,
    // Public audit may be visible to anyone: never persist cart row text,
    // address fragments, account identifiers, phone numbers or email addresses.
    matchingRows:matches.slice(0,2).map(x=>({skuMatched:sku.length>=5?exactSkuInText(x.text,sku):false,newCondition:/\bnew\b/i.test(x.text??'')&&!/\b(used|pre.?owned|refurbished|open.?box)\b/i.test(x.text??'')})),
    selectedFulfillment:selectedShipping.slice(0,2).map(x=>({phoenixZipMatched:selectedFulfillmentMatches(x.text,'85001')})),
    checkoutControlEnabled:observation.checkoutControl?.enabled===true,
    verifiedPurchase:false
  };
}
export async function captureCartControls(page,expected) {
  try {
    const observed=await page.evaluate(()=>{
      const visible=el=>!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
      const rowSelectors=[
        '[data-testid*="cart-item" i]','[data-qa*="cart-item" i]',
        '[class*="cart-item" i]','[class*="cartItem"]'
      ];
      const rows=[...document.querySelectorAll(rowSelectors.join(','))]
        .filter(visible).slice(0,12)
        .map(el=>({text:(el.innerText||'').replace(/\s+/g,' ').slice(0,450)}));
      const options=[...document.querySelectorAll('input[type="radio"],[role="radio"]')]
        .filter(visible).slice(0,20)
        .map(el=>({
          selected:el.checked===true||el.getAttribute('aria-checked')==='true',
          text:(el.closest('label')?.innerText||el.closest('[role="radiogroup"]')?.innerText||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').slice(0,220)
        }));
      const checkout=[...document.querySelectorAll('button,[role="button"]')]
        .filter(visible).filter(el=>/^(?:proceed to checkout|checkout|continue to checkout)$/i.test((el.innerText||el.getAttribute('aria-label')||'').trim()));
      return {rows,fulfillmentOptions:options,
        checkoutControl:{enabled:checkout.length===1&&!checkout[0].disabled&&checkout[0].getAttribute('aria-disabled')!=='true'}};
    });
    return assessCartControls(observed,expected);
  }catch(e){
    return {status:'cart-dom-unreadable',missing:['readable cart controls'],
      reason:String(e).slice(0,120),verifiedPurchase:false};
  }
}
