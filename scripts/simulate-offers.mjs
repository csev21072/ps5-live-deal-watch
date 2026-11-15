// Fully offline, fictional test. Never imports the GitHub publisher, opens
// issues, contacts a retailer, performs checkout, or sends a notification.
import {pathToFileURL} from 'node:url';
import {evaluate} from '../src/rules.mjs';
import {transition} from '../src/alerts/state.mjs';
import {buildVerifiedIssue} from '../src/alerts/issue.mjs';
import {fictionalOffer} from '../test/fixtures/fictional-offer.mjs';

export function runFictionalSimulation(now=Date.now()){
  let state=null;
  const results=[];
  function step(name,record){
    const verdict=evaluate(record,now);
    const before=state;
    const decision=transition(state,record,verdict);
    state=decision.next;
    const issue=decision.alert?buildVerifiedIssue(record,verdict,decision,{[record.id]:before??{}},'example/fictional-repo'):null;
    results.push({
      scenario:name,qualifies:verdict.qualifies,alertWouldBeCreated:decision.alert,
      reason:decision.reason,issueTitlePreview:issue?.title??null,
      eventKeyPreview:issue?.eventKey??null,
      rejectionReasons:verdict.reasons
    });
    return {decision,issue};
  }
  const original=fictionalOffer(now);
  step('fictional qualifying NEW PS5 Slim Disc',original);
  step('unchanged duplicate',fictionalOffer(now));
  step('wrong Phoenix ZIP',fictionalOffer(now,{
    fulfillment:{...original.fulfillment,zip:'95123'},
    checkoutEvidence:{...original.checkoutEvidence,zip:'95123'}
  }));
  step('unverified seller identity',fictionalOffer(now,{
    seller:'Unrelated Merchant',sellerText:'Sold by GameStop'
  }));
  step('CAPTCHA',fictionalOffer(now,{blocked:true}));
  step('confirmed sold out for exact SKU and Phoenix',fictionalOffer(now,{
    source:'live-retailer-purchase-surface',unavailable:true,
    diagnostic:{status:'unavailable'},
    probe:{status:'all-fulfillment-unavailable',fulfillmentSkuVerified:true,fulfillmentContextZip:'85001'}
  }));
  step('fictional verified restock',fictionalOffer(now));
  const lower=fictionalOffer(now,{price:439,priceText:'$439.00',
    checkoutEvidence:{...original.checkoutEvidence,priceText:'$439.00',itemText:'Sony PS5 Slim Disc 1TB SKU 422135 $439.00'}});
  step('verified material price drop',lower);
  step('unchanged lower price',lower);
  return {label:'FICTIONAL OFFLINE SIMULATION — NOT A REAL DEAL OR NOTIFICATION',
    githubApiCalls:0,retailerRequests:0,purchases:0,results};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  console.log(JSON.stringify(runFictionalSimulation(),null,2));
}
