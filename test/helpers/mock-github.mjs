// Test-only fetch interceptor. Every request is intercepted: NO NETWORK.
// Used with node --import to exercise the actual publisher subprocess.
import {writeFileSync} from 'node:fs';
const log=[];
let posts=0;
const previous=JSON.parse(process.env.PS5_MOCK_ISSUES??'[]');
globalThis.fetch=async (input,options={})=>{
  const url=new URL(String(input));
  if(url.origin!=='https://api.github.com' || !/^\/repos\/example\/fictional-repo\/issues/.test(url.pathname))
    throw new Error('BLOCKED unexpected network call: '+url.origin+url.pathname);
  const method=options.method??'GET';
  const body=options.body?JSON.parse(options.body):null;
  log.push({method,path:url.pathname,body});
  writeFileSync(process.env.PS5_MOCK_LOG,JSON.stringify(log,null,2));
  if(method==='GET' && url.pathname.endsWith('/issues')){
    return {ok:true,status:200,json:async()=>previous};
  }
  if(method==='POST' && url.pathname.endsWith('/issues')){
    posts++;
    if(process.env.PS5_MOCK_FAIL==='500')
      return {ok:false,status:500,json:async()=>({message:'fictional server error'})};
    if(process.env.PS5_MOCK_FAIL==='422' && posts===1)
      return {ok:false,status:422,json:async()=>({message:'fictional assignee rejection'})};
    return {ok:true,status:201,json:async()=>({number:123,title:body?.title})};
  }
  throw new Error('BLOCKED unexpected method or path: '+method+' '+url.pathname);
};
