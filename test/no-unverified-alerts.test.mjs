import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const workflow=fileURLToPath(new URL('../.github/workflows/scan.yml',import.meta.url));
const unsafePublisher=fileURLToPath(new URL('../src/publish-candidates.mjs',import.meta.url));

test('hourly workflow cannot publish unverified price leads',async()=>{
 const text=await readFile(workflow,'utf8');
 assert.match(text,/name:\s*Open GitHub issue ONLY for fully verified deals/);
 assert.match(text,/run:\s*npm run publish/);
 assert.doesNotMatch(text,/publish-candidates|Notify owner of below-target unverified|price-lead issue/i);
});
test('unverified candidate GitHub issue publisher does not exist',async()=>{
 await assert.rejects(access(unsafePublisher),{code:'ENOENT'});
});
