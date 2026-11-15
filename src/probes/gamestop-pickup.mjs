// Research-only GameStop pickup finder. This never proves an orderable
// reservation, and never returns confirmed=true. It may expose store listings
// but those are not SKU-specific checkout availability.
export async function inspectPickupFinder(page,zip='85001'){
  const result={status:'not-verified',zipRequested:zip,zipObserved:false,phoenixMentioned:false,storeEvidence:[],verifiedPickup:false};
  try{
    const button=page.getByRole('button',{name:/find a store|check store availability|select store/i}).first();
    const link=page.getByRole('link',{name:/find a store|check store availability|select store/i}).first();
    let trigger=null;
    if(await button.isVisible().catch(()=>false))trigger=button;
    else if(await link.isVisible().catch(()=>false))trigger=link;
    if(!trigger)return {...result,status:'finder-not-exposed'};
    await trigger.click({timeout:4500});
    const field=page.locator('input[placeholder*="ZIP" i],input[aria-label*="ZIP" i],input[name*="postal" i],input[placeholder*="postal" i]').first();
    if(!(await field.isVisible().catch(()=>false)))
      return {...result,status:'finder-zip-field-not-found'};
    await field.fill(zip,{timeout:3000});
    await field.press('Enter',{timeout:3000});
    await page.waitForTimeout(900);
    const text=(await page.locator('body').innerText({timeout:4500}).catch(()=>''))||'';
    if(/captcha|access denied|verify you are human|press\s*&\s*hold/i.test(text))
      return {...result,status:'blocked'};
    const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const storeEvidence=lines.filter(x=>/\b(Phoenix|Tempe|Scottsdale|85001|pickup|pick up|in stock|out of stock)\b/i.test(x)).slice(0,12).map(x=>x.slice(0,170));
    return {
      ...result,status:'store-list-observed-not-reservable',
      zipObserved:storeEvidence.some(x=>x.includes(zip)),
      phoenixMentioned:storeEvidence.some(x=>/Phoenix/i.test(x)),
      storeEvidence,verifiedPickup:false
    };
  }catch(e){
    return {...result,status:'finder-interaction-blocked',reason:String(e).slice(0,140)};
  }
}
