export function sonyPage(options={}) {
  const calls={clicks:0,urls:[]};let stage=0;
  const add={isVisible:async()=>true,isEnabled:async()=>options.enabled!==false,
    getAttribute:async()=>options.sku??'1000049888',click:async()=>{calls.clicks++;stage=1;}};
  const button={count:async()=>options.buttons??1,first:()=>add};
  const hero={filter:()=>hero,count:async()=>options.heroes??1,getByRole:()=>button};
  const review={waitFor:async()=>{},count:async()=>options.reviewCount??1,isVisible:async()=>options.confirmed!==false,
    getAttribute:async()=>options.href??'/en-us/checkout?tab=cart'};
  const page={
    locator:selector=>selector==='.productHero-info'?hero:selector==='.cart-physical-item'?{first:()=>({waitFor:async()=>{}})}:
      {innerText:async()=>options.blocked?'Verify you are human':stage===1?'Edit and Checkout':'Guest Checkout\nPlayStation 5 Console - 1 TB\n$449.00'},
    getByRole:(role)=>role==='heading'?{}:review,
    goto:async url=>{calls.urls.push(url);stage=2;},
    url:()=>options.redirect??'https://direct.playstation.com/en-us/checkout?tab=cart',
    evaluate:async()=>options.observation??{rows:[{sku:'1000049888',title:'PlayStation 5 Console - 1 TB',priceText:'$449.00',quantity:'1'}],checkoutEnabled:true}
  };
  return {page,calls};
}
