import {createHash} from 'node:crypto';

// These pages are used to find product URLs only. They are never price,
// seller, condition or fulfillment evidence.
export const searchPages=[
  {retailer:'PlayStation Direct',url:'https://direct.playstation.com/en-us/hardware/ps5',hosts:['direct.playstation.com']},
  {retailer:'Best Buy',url:'https://www.bestbuy.com/site/searchpage.jsp?st=ps5+slim',hosts:['www.bestbuy.com']},
  {retailer:'Target',url:'https://www.target.com/s?searchTerm=ps5+slim',hosts:['www.target.com']},
  {retailer:'Walmart',url:'https://www.walmart.com/search?q=ps5+slim',hosts:['www.walmart.com']},
  {retailer:'Amazon',url:'https://www.amazon.com/s?k=ps5+slim',hosts:['www.amazon.com']},
  {retailer:'GameStop',url:'https://www.gamestop.com/search/?q=ps5+slim',hosts:['www.gamestop.com']},
  {retailer:'Costco',url:'https://www.costco.com/s?keyword=ps5+slim',hosts:['www.costco.com','sameday.costco.com']}
];
const pathPatterns={
  'PlayStation Direct': /\/(?:buy-consoles|product|hardware\/ps5\/)[^?#]+/i,
  'Best Buy': /\/(?:site\/[^?#]+\/\d+\.p|product\/[^?#]+)/i,
  'Target': /\/p\/[^?#]+/i,
  'Walmart': /\/ip\/[^?#]+/i,
  'Amazon': /\/(?:dp|gp\/product)\/B0[A-Z0-9]{8}/i,
  'GameStop': /\/(?:consoles-hardware\/)?[^?#]*\/products\/[^?#]+/i,
  'Costco': /\/(?:product|store\/costco\/products\/)[^?#]+/i
};
export function discoverFromLinks(searchPage,links,existingUrls=[],limit=2){
  const found=[],seen=new Set(existingUrls.map(u=>canonical(u)).filter(Boolean));
  const allowed=new Set(searchPage.hosts);
  for(const link of links){
    const text=String(link.text??'').replace(/\s+/g,' ').trim();
    if(!/(?:playstation\s*5|ps5)/i.test(text))continue;
    if(!/\b(console|bundle|slim|disc edition|digital edition)\b/i.test(text))continue;
    if(/\b(refurbished|pre-owned|preowned|used|open.box|ps5 pro|playstation 5 pro|controller only|case only)\b/i.test(text))continue;
    if(/\b(compatible with|replacement|face\s*plates?|cover\s*plates?|shell\s*case|skin|charging station|stand|cooling fan|carrying case|accessor(?:y|ies)|empty box|console cover|controller skin|protective case|for ps5|for playstation 5)\b/i.test(text))continue;
    const digital=/\b(digital|all-digital)\b/i.test(text);
    const disc=/\b(disc|disk)\b/i.test(text);
    if(digital===disc)continue; // Explicit edition needed; never guess.
    let url;
    try{
      const parsed=new URL(link.href,searchPage.url);
      if(parsed.protocol!=='https:'||!allowed.has(parsed.hostname))continue;
      if(!pathPatterns[searchPage.retailer]?.test(parsed.pathname))continue;
      parsed.hash='';
      parsed.search=''; // Remove affiliate, tracking and search parameters.
      url=parsed.href;
    }catch{continue;}
    if(seen.has(url))continue;
    seen.add(url);
    const kind=digital?'digital':'disc';
    found.push({
      id:'discovered-'+searchPage.retailer.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+createHash('sha256').update(url).digest('hex').slice(0,10),
      retailer:searchPage.retailer,kind,url,host:new URL(url).hostname,
      discoveryText:text.slice(0,180),discoveryOnly:true,
      discoveryPriority:/\b(two controllers|2 controllers|extra controller|additional controller|dualSense bundle)\b/i.test(text)?2:1
    });
  }
  // Discovery priority is not evidence of actual bundle contents or value.
  return found.sort((a,b)=>b.discoveryPriority-a.discoveryPriority).slice(0,limit);
}
function canonical(value){
  try{const u=new URL(value);u.search='';u.hash='';return u.href;}catch{return null;}
}
export function classifyDiscoveryPage({title='',body='',links=[]}={}) {
  const visible=String(title)+' '+String(body).slice(0,2500);
  if(/captcha|verify you are human|press\s*&\s*hold|access denied|robot or human/i.test(visible))
    return 'blocked';
  if(!Array.isArray(links)||links.length===0)
    return 'no-readable-links';
  return 'inspected';
}
export async function discoverProducts(browser,existing,timeoutMs=9000){
  const candidates=[],coverage=[];
  const existingUrls=existing.map(x=>x.url);
  for(const searchPage of searchPages){
    const page=await browser.newPage({locale:'en-US'});
    try{
      await page.goto(searchPage.url,{waitUntil:'domcontentloaded',timeout:timeoutMs});
      const observed=await page.evaluate(()=>({
        title:document.title,
        body:(document.body?.innerText||'').slice(0,2500),
        links:[...document.querySelectorAll('a[href]')].slice(0,1000).map(a=>({
          href:a.href,text:(a.innerText?.trim()||a.getAttribute('aria-label')||a.querySelector('img[alt]')?.getAttribute('alt')||'').slice(0,250)
        }))
      }));
      const pageStatus=classifyDiscoveryPage(observed);
      const matches=pageStatus==='inspected'
        ? discoverFromLinks(searchPage,observed.links,[...existingUrls,...candidates.map(x=>x.url)])
        : [];
      candidates.push(...matches);
      coverage.push({retailer:searchPage.retailer,status:pageStatus==='inspected'&&matches.length===0?'inspected-no-matching-products':pageStatus,found:matches.length});
    }catch(e){
      coverage.push({retailer:searchPage.retailer,status:'unreadable',reason:String(e).slice(0,160),found:0});
    }finally{await page.close();}
  }
  return {candidates,coverage};
}
