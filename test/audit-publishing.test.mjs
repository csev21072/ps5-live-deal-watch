import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const workflow=await readFile(new URL('../.github/workflows/scan.yml',import.meta.url),'utf8');
const script=await readFile(new URL('../scripts/save-audit.sh',import.meta.url),'utf8');
test('public audit branch receives projected evidence, not raw scan JSON',()=>{
 assert.match(script,/node src\/public-audit\.mjs/);
 assert.match(script,/ps5-public-evidence\.json" evidence\/latest\.json/);
 assert.doesNotMatch(script,/cp "\$\{RUNNER_TEMP:-\/tmp\}\/ps5-evidence\.json" evidence\/latest\.json/);
});
test('GitHub Actions artifact does not upload the raw out directory',()=>{
 assert.match(workflow,/out\/public-evidence\.json/);
 assert.match(workflow,/out\/summary\.md/);
 assert.doesNotMatch(workflow,/path: out\//);
 assert.doesNotMatch(workflow,/path: \|\s*\n\s*out\/evidence\.json/);
});
test('reliability summary is generated from historical completed scans',()=>{
 assert.match(script,/node src\/reliability\.mjs/);
 assert.match(script,/evidence\/reliability\.json/);
});
test('no raw cart/checkout state is published in Actions artifact',()=>{
 const artifact=workflow.slice(workflow.indexOf('      - name: Save audit artifact'));
 const artifactPath=artifact.split('      - name: Publish non-alerting audit')[0];
 assert.doesNotMatch(artifactPath,/out\/alert-state\.json|out\/previous-alert-state\.json|out\/evidence\.json/);
});
