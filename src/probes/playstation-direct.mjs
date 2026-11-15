// Manufacturer-owned product facts for PlayStation Direct.
// Diagnostic-only: price, NEW condition, seller, checkout and Phoenix shipping
// are NOT verified here. Never construct a qualifying purchase record.
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
export function inspectSonyProductFacts({url,headings=[],body='',priceText=''}) {
  const result={
    status:'unverified',officialProductPage:false,productHeading:null,
    storageHint:null,editionHint:'unknown',discDriveHint:null,
    slimModelHint:false,oneDualSenseInBoxHint:false,
    displayedPriceHint:null,
    conditionVerified:false,sellerVerified:false,phoenixCheckoutVerified:false
  };
  let u;
  try{u=new URL(url);}catch{return {...result,status:'invalid-url'};}
  if(u.protocol!=='https:'||u.hostname!=='direct.playstation.com'||!u.pathname.startsWith('/en-us/buy-consoles/'))
    return {...result,status:'not-an-official-console-product-page'};
  result.officialProductPage=true;
  const heading=headings.map(norm).find(x=>/playstation.?5.*console/i.test(x));
  if(!heading)return {...result,status:'heading-not-confirmed'};
  if(/\b(refurbished|pro)\b/i.test(heading))return {...result,status:'excluded-model'};
  result.productHeading=heading.slice(0,180);
  result.storageHint=heading.match(/\b(825\s*GB|1\s*TB|2\s*TB)\b/i)?.[0]??null;
  result.editionHint=/digital edition/i.test(heading)?'digital':'disc';
  const text=String(body);
  const productText=text.slice(0,16000);
  result.slimModelHint=/\bCFI-2[01]00\b/i.test(productText)||/slim, sleek and compact console design/i.test(productText);
  const explicitNoDrive=/\bno disc drive\b|disc.free console/i.test(productText);
  const explicitDrive=/\bthis console has a disc drive\b/i.test(productText);
  result.discDriveHint=explicitNoDrive&&!explicitDrive?false:explicitDrive&&!explicitNoDrive?true:null;
  const boxSection=productText.match(/what.?s in the box([\s\S]{0,2000}?)(?:features|compatible with|see additional terms|learn more)/i)?.[1]??'';
  result.oneDualSenseInBoxHint=/dualSense.? wireless controller/i.test(boxSection);
  const prices=[...norm(priceText).matchAll(/\$\s*[\d,]+(?:\.\d{2})?/g)].map(x=>x[0]);
  result.displayedPriceHint=prices.length===1?prices[0]:null;
  result.status=result.discDriveHint===null||!result.storageHint?'product-facts-incomplete':'product-facts-observed-checkout-unverified';
  return result;
}
