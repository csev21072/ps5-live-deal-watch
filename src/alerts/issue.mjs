import {createHash} from 'node:crypto';
import {offerSignature} from './state.mjs';
import {publicRetailerUrl} from '../evidence/url.mjs';

// Issue bodies are publicly visible. Never include raw shipping/cart excerpts,
// addresses, account data, search parameters, or uncontrolled Markdown.
const publicLabel=(value,max=100)=>{
  const s=String(value??'').replace(/\s+/g,' ').trim();
  return s.length>0 && s.length<=max &&
    /^[\p{L}\p{N} .,&'()\-+/]+$/u.test(s) &&
    !/@|\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/.test(s)
      ? s : '[redacted]';
};

// Pure formatter: no network access, no GitHub Issues, no purchases.
// The caller must have a qualifying verdict from the production evaluator.
export function buildVerifiedIssue(record,verdict,decision,previous={},repository='') {
  if(verdict?.qualifies!==true || decision?.alert!==true)
    throw new Error('Refusing to format an unverified or non-alerting offer');
  if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))
    throw new Error('A valid GitHub repository is required');
  const signature=offerSignature(record);
  const old=previous[record.id]??{};
  const eventKey=createHash('sha256').update([
    record.id,decision.reason,signature,record.price,
    decision.reason==='verified-restock'?old.lastUnavailableAt??'':''
  ].join('|')).digest('hex');
  const safeUrl=publicRetailerUrl(record.url,record.host);
  if(!safeUrl)throw new Error('Cannot publish an unverified or unsafe retailer URL');
  const title='[PS5 VERIFIED '+publicLabel(record.id)+'] $'+record.price.toFixed(2)+' '+publicLabel(record.exactModel);
  const body=[
    '**Verified retailer-owned purchase evidence**',
    '- Retailer: '+publicLabel(record.retailer),
    '- Product: '+publicLabel(record.exactModel)+' / '+publicLabel(record.skuOrBundle),
    '- Price: $'+record.price.toFixed(2)+' ('+record.priceText+')',
    '- Seller / shipper: '+publicLabel(record.seller)+' / '+publicLabel(record.shipper),
    '- Condition: NEW (verified at retailer checkout)',
    '- Storage: '+publicLabel(record.storage),
    '- Disc drive: '+(record.discDrive?'Yes':'No'),
    '- Controllers: '+record.controllers,
    '- Fulfillment: '+record.fulfillment.method+' in ZIP '+record.fulfillment.zip,
    '- Checkout: exact item, selected NEW condition, seller, price and Phoenix fulfillment independently verified',
    '- Membership required: '+(record.membershipRequired===true?'Yes':'Not indicated'),
    '- Effective price: $'+verdict.effectivePrice.toFixed(2)+' = $'+record.price.toFixed(2)+' - $'+verdict.extraControllerCredit+' extra-controller allowance - $'+verdict.gameCredit+' documented game allowance',
    '- Previous sufficiently verified alerted price: '+(old.lastAlert?'$'+old.lastAlert.price.toFixed(2):'none recorded'),
    '- Checked at: '+record.checkedAt,
    '- Retailer URL: '+safeUrl,
    '- Alert reason: '+decision.reason,
    '- Alert event key: '+eventKey
  ].join('\n');
  return {title,body,assignees:[repository.split('/')[0]],eventKey};
}
