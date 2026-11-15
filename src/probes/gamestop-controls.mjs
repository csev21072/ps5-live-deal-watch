// Read-only DOM inspection of GameStop's currently selected product offer.
// A visible NEW label is not evidence that the NEW option was selected.
// This diagnostic never enables purchase alerts or performs checkout.
const clean=x=>String(x??'').replace(/\s+/g,' ').trim().slice(0,180);
export function classifyPurchaseControls(data={}) {
  const controls=Array.isArray(data.controls)?data.controls:[];
  const cartButtons=controls.filter(x=>/add\s+to\s+cart/i.test(x.label??''));
  const selected=controls.filter(x=>x.selected===true);
  const newSelected=selected.filter(x=>/\bnew\b/i.test(x.label??'') && !/\b(pre.?owned|used|not new|refurbished)\b/i.test(x.label??''));
  const usedSelected=selected.filter(x=>/\b(pre.?owned|used|refurbished)\b/i.test(x.label??''));
  const selectedNew=newSelected.length===1 && usedSelected.length===0;
  const actionable=cartButtons.filter(x=>x.disabled===false);
  return {
    status:cartButtons.length===0?'cart-control-missing':actionable.length===0?'cart-control-disabled':selectedNew?'new-selected-cart-control-enabled':'condition-unverified',
    cartControlCount:cartButtons.length,enabledCartControls:actionable.length,
    newConditionSelected:selectedNew,
    selectedConditionLabels:selected.map(x=>clean(x.label)).slice(0,8),
    cartControls:cartButtons.slice(0,4).map(x=>({label:clean(x.label),disabled:x.disabled,reason:clean(x.reason)})),
    // The actual selection must be established by the retailer's DOM, not a guess.
    verifiedCheckout:false
  };
}
export async function inspectGameStopControls(page) {
  try{
    const data=await page.evaluate(()=>{
      const visible=el=>!!el?.getClientRects()?.length&&getComputedStyle(el).visibility!=='hidden';
      const all=[...document.querySelectorAll('button,[role="button"],input[type="radio"],[role="radio"],[aria-pressed]')].filter(visible);
      const controls=[];
      for(const el of all){
        const label=(el.getAttribute('aria-label')||el.innerText||el.closest('label')?.innerText||el.getAttribute('value')||'').replace(/\s+/g,' ').trim();
        if(!/add\s+to\s+cart|new|pre.?owned|used|refurbished|condition|availability/i.test(label))continue;
        const disabled=el.matches(':disabled')||el.getAttribute('aria-disabled')==='true';
        const selected=el.getAttribute('aria-pressed')==='true'||el.getAttribute('aria-checked')==='true'||el.matches('input:checked')||el.getAttribute('data-state')==='checked';
        const reason=el.getAttribute('title')||el.getAttribute('aria-description')||el.closest('[title]')?.getAttribute('title')||'';
        controls.push({label:label.slice(0,180),disabled,selected,reason:reason.slice(0,180)});
        if(controls.length===35)break;
      }
      return {controls};
    });
    return classifyPurchaseControls(data);
  }catch(e){
    return {status:'control-inspection-failed',reason:String(e).slice(0,140),verifiedCheckout:false};
  }
}
