import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Non-alerting, descriptive reliability metrics. A long gap does not prove
// GitHub skipped a scheduled run; it may reflect queuing or an incomplete run.
export function summarizeReliability(history=[]){
  if(!Array.isArray(history))throw new Error('History must be an array');
  const rows=history.filter(x=>x&&Number.isFinite(Date.parse(x.checkedAt)))
    .sort((a,b)=>Date.parse(a.checkedAt)-Date.parse(b.checkedAt));
  if(rows.length===0)return {status:'no-history',observedRuns:0,latestCompletedAt:null,
    longObservedGaps:0,maxObservedGapHours:null,fullyAttemptedSevenRetailers:0,
    verifiedOffersObserved:0};
  const last=rows.at(-1);
  let longObservedGaps=0,maxGap=0;
  for(let i=1;i<rows.length;i++){
    const hours=(Date.parse(rows[i].checkedAt)-Date.parse(rows[i-1].checkedAt))/3600000;
    maxGap=Math.max(maxGap,hours);
    if(hours>1.5)longObservedGaps++;
  }
  const latestTime=Date.parse(last.checkedAt);
  const last24=rows.filter(x=>latestTime-Date.parse(x.checkedAt)<24*3600000);
  const attempted=rows.filter(x=>x.retailersAttempted===7).length;
  const verified=rows.reduce((sum,x)=>sum+(Number.isInteger(x.verifiedOffers)?x.verifiedOffers:0),0);
  return {
    status:'observational-only',
    latestCompletedAt:last.checkedAt,
    observedRuns:rows.length,
    observedRunsWithin24HoursOfLatest:last24.length,
    longObservedGaps,
    maxObservedGapHours:rows.length>1?Math.round(maxGap*100)/100:null,
    fullyAttemptedSevenRetailers:attempted,
    runsWithPartialRetailerAttempts:rows.length-attempted,
    verifiedOffersObserved:verified,
    caveat:'These are completed scan observations, not proof of on-time scheduling or full checkout coverage.'
  };
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const [historyPath,outputPath]=process.argv.slice(2);
  if(!historyPath||!outputPath)throw new Error('Usage: node src/reliability.mjs history.json output.json');
  const history=JSON.parse(await readFile(historyPath,'utf8'));
  await writeFile(outputPath,JSON.stringify(summarizeReliability(history),null,2)+'\n');
  console.log('Saved observational-only reliability summary');
}
