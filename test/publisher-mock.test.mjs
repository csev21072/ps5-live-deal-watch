import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {fictionalOffer} from './fixtures/fictional-offer.mjs';
import {evaluate} from '../src/rules.mjs';
import {transition} from '../src/alerts/state.mjs';
import {buildVerifiedIssue} from '../src/alerts/issue.mjs';

const publisher=fileURLToPath(new URL('../src/publish.mjs',import.meta.url));
const mock=fileURLToPath(new URL('./helpers/mock-github.mjs',import.meta.url));
const now=Date.now();
async function runPublisher(record,options={}){
  const dir=await mkdtemp(join(tmpdir(),'ps5-zero-network-'));
  await mkdir(join(dir,'out'));
  await writeFile(join(dir,'out/evidence.json'),JSON.stringify({records:[record]}));
  await writeFile(join(dir,'out/previous-alert-state.json'),JSON.stringify(options.previous??{}));
  const log=join(dir,'mock-requests.json');
  const result=spawnSync(process.execPath,['--import',mock,publisher],{
    cwd:dir,encoding:'utf8',timeout:12000,
    env:{
      PATH:process.env.PATH,HOME:process.env.HOME,
      GITHUB_REPOSITORY:'example/fictional-repo',
      GITHUB_TOKEN:'FICTIONAL_NO_NETWORK_TOKEN',
      PS5_MOCK_LOG:log,
      PS5_MOCK_ISSUES:JSON.stringify(options.issues??[]),
      PS5_MOCK_FAIL:options.fail??''
    }
  });
  let requests=[];
  try{requests=JSON.parse(await readFile(log,'utf8'));}catch{}
  return {dir,result,requests};
}
async function clean(run){await rm(run.dir,{recursive:true,force:true});}
test('actual publisher creates one simulated owner-assigned issue through mocked API',async()=>{
  const run=await runPublisher(fictionalOffer(now));
  try{
    assert.equal(run.result.status,0,run.result.stderr);
    assert.deepEqual(run.requests.map(x=>x.method),['GET','POST']);
    const issue=run.requests[1].body;
    assert.equal(issue.assignees[0],'example');
    assert.match(issue.title,/PS5 VERIFIED/);
    assert.match(issue.body,/Phoenix 85001/);
    const state=JSON.parse(await readFile(join(run.dir,'out/alert-state.json'),'utf8'));
    assert.equal(state['fictional-gamestop-disc'].status,'verified-orderable');
  }finally{await clean(run);}
});
test('duplicate event already in GitHub issues does not POST again',async()=>{
  const record=fictionalOffer(now);
  const verdict=evaluate(record,now);
  const decision=transition(null,record,verdict);
  const existing=buildVerifiedIssue(record,verdict,decision,{},'example/fictional-repo');
  const run=await runPublisher(record,{issues:[{body:existing.body}]});
  try{
    assert.equal(run.result.status,0,run.result.stderr);
    assert.deepEqual(run.requests.map(x=>x.method),['GET']);
  }finally{await clean(run);}
});
test('unverified fictional checkout makes no GitHub requests',async()=>{
  const record=fictionalOffer(now,{blocked:true});
  const run=await runPublisher(record);
  try{
    assert.equal(run.result.status,0,run.result.stderr);
    assert.deepEqual(run.requests,[]);
  }finally{await clean(run);}
});
test('GitHub server failure cannot advance alert state',async()=>{
  const run=await runPublisher(fictionalOffer(now),{fail:'500'});
  try{
    assert.notEqual(run.result.status,0);
    assert.equal(run.requests.filter(x=>x.method==='POST').length,1);
    await assert.rejects(access(join(run.dir,'out/alert-state.json')));
  }finally{await clean(run);}
});
test('assignee validation rejection retries once without assignee',async()=>{
  const run=await runPublisher(fictionalOffer(now),{fail:'422'});
  try{
    assert.equal(run.result.status,0,run.result.stderr);
    const posts=run.requests.filter(x=>x.method==='POST');
    assert.equal(posts.length,2);
    assert.deepEqual(posts[0].body.assignees,['example']);
    assert.equal(posts[1].body.assignees,undefined);
  }finally{await clean(run);}
});
