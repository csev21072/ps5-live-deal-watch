// Only numeric public GitHub run identifiers are retained; never environment dumps.
export function runProvenance(value={}) {
  const runId=typeof value.runId==='string' && /^[1-9][0-9]{0,19}$/.test(value.runId)?value.runId:null;
  const runAttempt=Number.isSafeInteger(value.runAttempt)&&value.runAttempt>0?value.runAttempt:null;
  return {runId,runAttempt};
}
export function scheduledFirstAttempts(history) {
  const seen=new Set();
  return [...history].sort((a,b)=>Date.parse(a.checkedAt)-Date.parse(b.checkedAt)).filter(row=>{
    if(row.triggerType!=='schedule')return false;
    const {runId,runAttempt}=runProvenance(row);
    if(runAttempt!==null && runAttempt>1)return false;
    const key=runId??row.checkedAt;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
