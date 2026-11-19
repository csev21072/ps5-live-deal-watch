import {priceFromText} from '../rules.mjs';
const normalize=value=>String(value??'').replace(/\s+/g,' ').trim();
// Observed guest cart markup, 2026-11-19. Recommendations and order totals
// are outside .cart-physical-item and must never become console evidence.
export function assessSonyCartControls(observation={},expected={}) {
  const rows=Array.isArray(observation.rows)?observation.rows:[];
  const sku=String(expected.sku??'');
  const matches=rows.filter(row=>/^[0-9]{8,12}$/.test(sku)&&row.sku===sku&&
    normalize(expected.productName).length>=15&&normalize(row.title)===normalize(expected.productName));
  const missing=[];
  if(matches.length!==1||rows.length!==1)missing.push('exactly one matching console and no extra cart items');
  const row=matches.length===1?matches[0]:null;
  const priceMatched=row!==null&&Number.isFinite(expected.price)&&/^\$\s*[0-9,]+\.\d{2}$/.test(normalize(row.priceText))&&priceFromText(row.priceText)===expected.price;
  if(!priceMatched)missing.push('exact console line-item price');
  if(row?.quantity!=='1')missing.push('console quantity one');
  if(observation.checkoutEnabled!==true)missing.push('enabled checkout control');
  // This page has no destination confirmation, condition or selected seller labels.
  missing.push('Phoenix fulfillment not observed','selected NEW condition not observed','selected seller and shipper not observed');
  return {status:'incomplete-cart-controls',missing,
    matchingRows:matches.slice(0,2).map(x=>({skuMatched:true,itemPriceMatched:priceMatched,
      quantityOne:x.quantity==='1',newCondition:false})),
    selectedFulfillment:[],checkoutControlEnabled:observation.checkoutEnabled===true,
    verifiedPurchase:false};
}
export async function captureSonyCartControls(page,expected) {
  try {
    const observation=await page.evaluate(()=>{
      const visible=el=>!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
      const rows=[...document.querySelectorAll('.cart-physical-item')].filter(visible).slice(0,12).map(el=>{
        const quantities=[...el.querySelectorAll('input[role="combobox"]')].filter(visible);
        const titles=el.querySelectorAll('.cart-physical-item__prod-desc_heading-ctnr_heading');
        const prices=el.querySelectorAll('.cart-physical-item__prod-desc_prod-price-ctnr_prod-price');
        return {title:titles.length===1?titles[0].innerText:'',priceText:prices.length===1?prices[0].innerText:'',
          sku:quantities.length===1?quantities[0].id:null,quantity:quantities.length===1?quantities[0].value:null};
      });
      const buttons=[...document.querySelectorAll('button,[role="button"]')].filter(visible)
        .filter(el=>(el.innerText||el.getAttribute('aria-label')||'').trim()==='Checkout');
      return {rows,checkoutEnabled:buttons.length===1&&!buttons[0].disabled&&buttons[0].getAttribute('aria-disabled')!=='true'};
    });
    return assessSonyCartControls(observation,expected);
  }catch{return {status:'cart-dom-unreadable',matchingRows:[],selectedFulfillment:[],checkoutControlEnabled:false,verifiedPurchase:false};}
}
