// Status-only research queue. Prices are unverified product-page observations,
// never orderable deals. Do not send alerts from this queue.
const threshold=kind=>kind==='disc'?500:kind==='digital'?450:null;
const blockedProbe=new Set(['cart-not-orderable','cart-button-unavailable',
  'cart-control-disabled','all-fulfillment-unavailable-unscoped',
  'shipping-unavailable-pickup-unverified','stock-unavailable-pickup-unverified',
  'price-above-target','cart-action-disabled']);
export function candidateReadiness(records=[]){
  if(!Array.isArray(records))throw new Error('Records must be an array');
  const items=records.map(r=>{
    const limit=threshold(r.kind);
    const price=Number.isFinite(r.price)&&r.price>0?r.price:null;
    const productObserved=r.source==='live-retailer-purchase-surface'&&
      r.blocked!==true&&r.productEvidence?.editionHint===r.kind;
    const checkoutVerified=r.verdict?.qualifies===true;
    let status='not-a-price-candidate';
    if(checkoutVerified)status='verified-orderable';
    else if(!productObserved)status='product-or-edition-unverified';
    else if(price===null)status='price-unreadable';
    else if(price>limit)status='above-base-target-bundle-credits-unverified';
    else if(blockedProbe.has(r.probe?.status))status='attractive-price-but-not-orderable';
    else status='attractive-price-checkout-unverified';
    return {
      id:String(r.id??'').slice(0,100),
      retailer:r.retailer,
      kind:r.kind,
      price,
      baseTarget:limit,
      priceVsBaseTarget:price===null||limit===null?null:Math.round((price-limit)*100)/100,
      status,
      checkoutVerified,
      // This is a research queue, not an availability notification.
      alertEligible:checkoutVerified
    };
  });
  const order={
    'verified-orderable':0,'attractive-price-checkout-unverified':1,
    'attractive-price-but-not-orderable':2,
    'above-base-target-bundle-credits-unverified':3,
    'price-unreadable':4,'product-or-edition-unverified':5,
    'not-a-price-candidate':6
  };
  items.sort((a,b)=>(order[a.status]??9)-(order[b.status]??9) ||
    (a.priceVsBaseTarget??9999)-(b.priceVsBaseTarget??9999));
  return {
    note:'Diagnostic-only product prices. Never treat this queue as verified stock or a purchase alert.',
    candidates:items,
    attractiveUnverified:items.filter(x=>x.status.startsWith('attractive-price-')).length,
    verifiedOrderable:items.filter(x=>x.checkoutVerified).length
  };
}
