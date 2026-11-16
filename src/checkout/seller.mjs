// Seller identity is positive evidence only if the retailer explicitly labels
// the seller and shipper. A substring alone can be a negation or another party.
const escapeRegex=value=>[...String(value)].map(ch=>'\\^$.*+?()[]{}|'.includes(ch)?'\\'+ch:ch).join('');
const normalize=value=>String(value??'').trim().replace(/\s+/g,' ');
export function labeledSellerMatches(evidence,identity){
  const name=normalize(identity);
  const text=normalize(evidence);
  if(name.length<2||name.length>90||text.length>400)return false;
  const seller=new RegExp('(?:^|[|;])\\s*(?:sold\\s+by|seller\\s*:)\\s*'+escapeRegex(name)+'(?=$|[\\s|;,.)])','i');
  return seller.test(text) && !/\b(not|never|no longer)\s+sold\s+by\b/i.test(text);
}
export function labeledShipperMatches(evidence,identity){
  const name=normalize(identity);
  const text=normalize(evidence);
  if(name.length<2||name.length>90||text.length>400)return false;
  const shipper=new RegExp('(?:^|[|;])\\s*(?:ships?\\s+from|shipped\\s+by|fulfilled\\s+by|shipper\\s*:)\\s*'+escapeRegex(name)+'(?=$|[\\s|;,.)])','i');
  return shipper.test(text) && !/\b(not|never|no longer)\s+(?:shipped\s+by|fulfilled\s+by)\b/i.test(text);
}
