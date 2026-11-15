// Target product-page price research. Structured metadata is a hint only;
// never use it as checkout price, inventory, NEW condition, or seller evidence.
const normalize=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const money=value=>{
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(typeof value==='string' && /^\d{2,4}(?:\.\d{1,2})?$/.test(value.trim()))return Number(value);
  return null;
};
export function classifyTargetPriceHint({productHeading='',products=[]}={}) {
  const heading=normalize(productHeading);
  if(heading.length<15)return {status:'product-heading-unconfirmed',verifiedCheckout:false};
  const matches=[];
  for(const p of products){
    if(!p||normalize(p.name)!==heading)continue;
    const offers=Array.isArray(p.offers)?p.offers:[p.offers];
    for(const offer of offers){
      if(!offer || offer.priceCurrency!=='USD')continue;
      const amount=money(offer.price);
      if(amount!==null && amount>=100 && amount<=1500)matches.push(amount);
    }
  }
  const unique=[...new Set(matches)];
  if(unique.length!==1)return {status:unique.length>1?'ambiguous-structured-prices':'price-hint-not-found',verifiedCheckout:false};
  return {status:'structured-product-price-hint',amount:unique[0],
    priceText:'$'+unique[0].toFixed(2),source:'product-jsonld',
    verifiedCheckout:false,verifiedStock:false,verifiedSeller:false};
}
export async function inspectTargetPriceHint(page,productHeading){
  try{
    const products=await page.evaluate(()=>{
      const results=[];
      for(const script of [...document.querySelectorAll('script[type="application/ld+json"]')].slice(0,15)){
        try{
          const data=JSON.parse(script.textContent||'null');
          const stack=Array.isArray(data)?data:[data];
          while(stack.length && results.length<15){
            const node=stack.pop();
            if(!node||typeof node!=='object')continue;
            if(Array.isArray(node)){stack.push(...node);continue;}
            if(node['@graph'])stack.push(node['@graph']);
            if(node['@type']==='Product'||(Array.isArray(node['@type'])&&node['@type'].includes('Product')))
              results.push({name:node.name,offers:node.offers});
          }
        }catch{}
      }
      return results;
    });
    return classifyTargetPriceHint({productHeading,products});
  }catch{return {status:'target-structured-data-unreadable',verifiedCheckout:false};}
}
