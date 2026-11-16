import test from 'node:test';
import assert from 'node:assert/strict';
import {publicAudit} from '../src/public-audit.mjs';
const sensitive='Jane Example jane@example.org 123 Main Street';
const raw={
  checkedAt:'2026-11-15T23:40:00.000Z',zip:'85001',
  discovery:{coverage:[{retailer:'Target',status:'inspected',found:1,reason:sensitive}]},
  coverage:{expectedRetailers:7,retailersAttempted:1,retailersWithVerifiedOffer:0,
    allRetailersAttempted:false,retailersWithoutVerifiedOffers:7,
    retailerResults:[{retailer:'Target',status:'product-pages-inspected-checkout-unverified',
      attemptedPages:1,unreadablePages:0,blockedPages:0,productIdentifiedPages:1,
      checkoutInspectedPages:0,verifiedOrderableOffers:0,discoveryStatus:'inspected',
      note:sensitive}]},
  records:[{
    id:'target-disc-bundle',retailer:'Target',kind:'disc',host:'www.target.com',
    url:'https://www.target.com/p/ps5/-/A-94907150?session=SECRET#email',
    checkedAt:'2026-11-15T23:40:00.000Z',source:'live-retailer-purchase-surface',
    price:449.99,priceText:'$449.99',title:sensitive,scanNote:sensitive,
    diagnostic:{status:'price-unreadable',evidence:[sensitive]},
    productEvidence:{productHeading:'PlayStation 5 Slim Disc',pageTitle:sensitive,
      highlights:[sensitive],visibleLabels:[sensitive],editionHint:'disc',storageHint:'1TB'},
    probe:{status:'cart-inspected-unverified',cartEvidence:{
      cartText:sensitive,checkoutEvidence:{account:sensitive}},reason:sensitive},
    checkoutEvidence:{itemText:sensitive},fulfillment:{locationText:sensitive},
    verdict:{qualifies:false,reasons:[sensitive]}
  }]
};
test('public audit strips raw cart, page, address, account and token data',()=>{
 const audit=publicAudit(raw),text=JSON.stringify(audit);
 for(const secret of ['Jane','example.org','Main Street','SECRET','checkoutEvidence','cartText','highlights','visibleLabels','scanNote'])
   assert.ok(!text.includes(secret),secret);
 assert.equal(audit.records[0].price,449.99);
 assert.equal(audit.records[0].url,'https://www.target.com/p/ps5/-/A-94907150');
 assert.equal(audit.records[0].probe.verifiedPurchase,false);
});
test('coverage counts remain useful after public projection',()=>{
 const audit=publicAudit(raw);
 assert.equal(audit.coverage.expectedRetailers,7);
 assert.equal(audit.coverage.retailerResults[0].attemptedPages,1);
 assert.equal(audit.records[0].productEvidence.editionHint,'disc');
});
test('unexpected free-text statuses cannot leak into public audit',()=>{
 const audit=publicAudit({...raw,records:[{...raw.records[0],
   diagnostic:{status:sensitive},probe:{status:sensitive},
   priceHint:{status:sensitive},sonyPrice:{status:sensitive}
 }]});
 const text=JSON.stringify(audit);
 assert.ok(!text.includes('Jane'));
 assert.equal(audit.records[0].diagnostic.status,'unknown');
});
test('invalid input fails rather than publishing arbitrary data',()=>{
 assert.throws(()=>publicAudit({records:'not-an-array'}));
});
test('public audit never invents a verified checkout from a research probe',()=>{
 const audit=publicAudit({...raw,records:[{...raw.records[0],probe:{
   status:'cart-inspected-unverified',verifiedPurchase:true,checkoutVerified:true
 }}]});
 assert.equal(audit.records[0].probe.verifiedPurchase,false);
});

test('public candidate research queue never asserts checkout from a price',()=>{
 const audit=publicAudit(raw);
 assert.equal(audit.candidateResearch.verifiedOrderable,0);
 assert.equal(audit.candidateResearch.candidates[0].alertEligible,false);
 assert.match(audit.candidateResearch.note,/Diagnostic-only/);
});

test('public audit keeps only allowlisted scan trigger types',()=>{
 assert.equal(publicAudit({...raw,triggerType:'schedule'}).triggerType,'schedule');
 assert.equal(publicAudit({...raw,triggerType:'push'}).triggerType,'push');
 assert.equal(publicAudit({...raw,triggerType:'email@example.org'}).triggerType,'unknown');
});

test('public audit rejects URLs from unapproved retailer host pairs',()=>{
 const a=publicAudit({...raw,records:[{...raw.records[0],
   host:'evil.example',url:'https://evil.example/ps5?secret=token'}]});
 assert.equal(a.records[0].url,null);
 assert.equal(a.records[0].diagnostic.status,'invalid-public-url');
 assert.ok(!JSON.stringify(a).includes('evil.example'));
});
