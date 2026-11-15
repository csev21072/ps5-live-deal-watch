// Pure alert-state transitions. No I/O and no purchase actions.
// "Unknown" and blocked scans never imply a restock or an out-of-stock event.
// A restock is only established by a prior explicit, product-specific,
// retailer-owned unavailable observation followed by full verified checkout.
export const MATERIAL_PRICE_CHANGE_DOLLARS=5;
export function offerSignature(r) {
  return [
    r.id,r.retailer,r.skuOrBundle,r.kind,r.condition,
    r.seller,r.shipper,r.controllers,r.storage,r.discDrive,
    r.fulfillment?.method,r.fulfillment?.zip,
    r.conditions??'',r.membershipRequired??false
  ].map(x=>String(x??'')).join('|');
}
export function confirmedUnavailable(r) {
  // Never infer unavailability from a generic multi-product catalog badge.
  return r?.unavailable===true
    && r?.blocked!==true
    && r?.source==='live-retailer-purchase-surface'
    && r?.diagnostic?.status==='unavailable'
    && r?.probe?.status==='all-fulfillment-unavailable'
    && r?.retailer==='GameStop'
    && Boolean(r.id);
}
export function transition(previous,record,verdict) {
  const before=previous??{status:'unknown',lastAlert:null};
  const next={...before,lastCheckedAt:record.checkedAt??null};
  if(verdict?.qualifies===true) {
    const sig=offerSignature(record);
    const last=before.lastAlert;
    const newOffer=!last;
    const changedIdentity=!!last && last.signature!==sig;
    const changedPrice=!!last && Math.abs(record.price-last.price)>=MATERIAL_PRICE_CHANGE_DOLLARS;
    const restocked=!!last && before.status==='confirmed-unavailable';
    const shouldAlert=newOffer||changedIdentity||changedPrice||restocked;
    next.status='verified-orderable';
    next.lastVerifiedAt=record.checkedAt;
    if(shouldAlert)next.lastAlert={signature:sig,price:record.price,checkedAt:record.checkedAt};
    return {alert:shouldAlert,reason:newOffer?'first-verified-offer':changedIdentity?'material-terms-change':changedPrice?'material-price-change':restocked?'verified-restock':'unchanged-verified-offer',next};
  }
  if(confirmedUnavailable(record)) {
    next.status='confirmed-unavailable';
    next.lastUnavailableAt=record.checkedAt;
    return {alert:false,reason:'confirmed-unavailable',next};
  }
  // A failed, partial, blocked or stale scan cannot erase a verified state.
  return {alert:false,reason:'incomplete-or-unverified',next};
}
export function processRecords(previousById,records,verdicts) {
  const next={...previousById},alerts=[],decisions=[];
  for(let i=0;i<records.length;i++){
    const r=records[i];
    if(!r?.id)continue;
    const decision=transition(next[r.id],r,verdicts[i]);
    next[r.id]=decision.next;
    decisions.push({id:r.id,reason:decision.reason,alert:decision.alert});
    if(decision.alert)alerts.push(r);
  }
  return {next,alerts,decisions};
}
