import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Public audit history contains ONLY coarse status counts, no prices,
// accounts, cookies, addresses, cart contents, or user-facing notifications.
export function appendAuditHistory(previous, latest, maxEntries=168) {
  if(!Array.isArray(previous))throw new Error('Audit history must be an array');
  const at=latest?.checkedAt;
  if(!at || !Number.isFinite(Date.parse(at)))throw new Error('Latest scan timestamp invalid');
  const rows=latest.records;
  if(!Array.isArray(rows))throw new Error('Latest scan records invalid');
  const uniqueRetailers=[...new Set(rows.map(r=>r.retailer).filter(Boolean))];
  const item={
    checkedAt:at,
    attemptedPages:rows.length,
    retailersAttempted:uniqueRetailers.length,
    readableProductPages:rows.filter(r=>r.source==='live-retailer-purchase-surface' &&
      r.blocked!==true && (r.productEvidence?.productHeading||r.sonyFacts?.officialProductPage)).length,
    blockedPages:rows.filter(r=>r.blocked===true||r.diagnostic?.status==='blocked').length,
    unreadablePages:rows.filter(r=>r.source==='unreadable'||r.diagnostic?.status==='unreadable').length,
    verifiedOffers:rows.filter(r=>r.verdict?.qualifies===true).length,
    incompleteCoverage:latest.coverage?.allRetailersAttempted!==true ||
      latest.coverage?.retailersWithoutVerifiedOffers>0
  };
  const prior=previous.filter(r=>r&&Number.isFinite(Date.parse(r.checkedAt))&&r.checkedAt!==at);
  const merged=[...prior,item].sort((a,b)=>Date.parse(a.checkedAt)-Date.parse(b.checkedAt));
  const last=merged.slice(-maxEntries);
  for(let i=0;i<last.length;i++){
    const gap=i===0?null:(Date.parse(last[i].checkedAt)-Date.parse(last[i-1].checkedAt))/3600000;
    last[i]={...last[i],gapSincePreviousHours:gap===null?null:Math.round(gap*100)/100};
  }
  return last;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const [previousPath,latestPath,outputPath]=process.argv.slice(2);
  if(!previousPath||!latestPath||!outputPath)throw new Error('Usage: node src/audit-history.mjs previous latest output');
  const previous=JSON.parse(await readFile(previousPath,'utf8'));
  const latest=JSON.parse(await readFile(latestPath,'utf8'));
  const history=appendAuditHistory(previous,latest);
  await writeFile(outputPath,JSON.stringify(history,null,2)+'\n');
  console.log('Saved '+history.length+' non-alerting hourly audit history entries');
}
