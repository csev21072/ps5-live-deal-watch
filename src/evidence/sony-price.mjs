// Strict parsing of the official Sony purchase-price widget.
// Price is a candidate observation only; not checkout or stock proof.
export function parseSonyPriceEvidence({priceText='',priceSelector='',priceContext=''}={}){
  const result={price:null,priceText:'',status:'unverified',selector:priceSelector||null,
    context:String(priceContext).replace(/\s+/g,' ').trim().slice(0,120)};
  if(!['[data-qa="product-price"]','.product-price'].includes(priceSelector))
    return {...result,status:'unknown-price-selector'};
  const raw=String(priceText).replace(/\s+/g,' ').trim();
  const context=String(priceContext).replace(/\s+/g,' ').trim();
  let amount=null;
  if(/^\$\s*\d{2,4}(?:\.\d{2})?$/.test(raw)){
    amount=Number(raw.replace('$','').trim());
  }else if(/^\d{2,4}(?:\.\d{2})?$/.test(raw)){
    const integer=raw.split('.')[0];
    const cents=raw.includes('.')?raw.split('.')[1]:'00';
    // Require a visible dollar symbol adjacent to this precise price.
    const re=new RegExp('\\$\\s*'+integer+'(?:\\s*\\.\\s*'+cents+')?(?!\\s*\\.\\s*\\d|\\d)');
    if(re.test(context))amount=Number(raw);
  }
  if(!Number.isFinite(amount)||amount<100||amount>2000)
    return {...result,status:'currency-or-price-unconfirmed'};
  return {...result,status:'retailer-price-widget-observed',price:amount,
    priceText:'$'+amount.toFixed(2)};
}
