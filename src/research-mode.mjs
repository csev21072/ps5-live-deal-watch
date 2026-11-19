// Explicit manual-only diagnostic mode. Never changes deal price limits.
export function sonyResearchMode(env={}) {
  const selection=env.PS5_SONY_CART_RESEARCH??'none';
  if(selection==='none'||selection==='')return null;
  if(env.GITHUB_EVENT_NAME!=='workflow_dispatch')
    throw new Error('Sony cart research requires an explicit manual workflow');
  if(!['disc','digital'].includes(selection))throw new Error('Invalid Sony research edition');
  return selection;
}
