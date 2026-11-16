import test from 'node:test';
import assert from 'node:assert/strict';
import {fictionalOffer} from './fixtures/fictional-offer.mjs';
import {evaluate} from '../src/rules.mjs';
import {transition} from '../src/alerts/state.mjs';
import {buildVerifiedIssue} from '../src/alerts/issue.mjs';
const now=Date.now();
test('verified deal issue never publishes shipping address or cart text',()=>{
 const r=fictionalOffer(now);
 const secret='Jane Example jane@example.org 123 Main Street';
 r.fulfillment.text='Shipping to Phoenix 85001 '+secret;
 r.fulfillment.locationText='Shipping to Phoenix 85001 '+secret;
 r.checkoutEvidence.fulfillmentText='Shipping to Phoenix 85001 '+secret;
 r.url+='?session=secret-token#checkout';
 const verdict=evaluate(r,now);
 assert.equal(verdict.qualifies,true,verdict.reasons.join(', '));
 const decision=transition(null,r,verdict);
 const issue=buildVerifiedIssue(r,verdict,decision,{},'example/fictional-repo');
 for(const sensitive of ['Jane','example.org','Main Street','secret-token','#checkout']){
   assert.ok(!issue.body.includes(sensitive),sensitive);
   assert.ok(!issue.title.includes(sensitive),sensitive);
 }
 assert.match(issue.body,/Phoenix 85001/);
 assert.match(issue.body,/verified at retailer checkout/);
});
test('unexpected arbitrary seller text is redacted in public issue',()=>{
 const r=fictionalOffer(now);
 r.seller='Jane jane@example.org';
 r.sellerText='Sold by Jane jane@example.org';
 r.checkoutEvidence.selectedSeller=r.seller;
 const verdict=evaluate(r,now);
 assert.equal(verdict.qualifies,true,verdict.reasons.join(', '));
 const decision=transition(null,r,verdict);
 const issue=buildVerifiedIssue(r,verdict,decision,{},'example/fictional-repo');
 assert.ok(!issue.body.includes('jane@example.org'));
 assert.match(issue.body,/\[redacted\]/);
});
