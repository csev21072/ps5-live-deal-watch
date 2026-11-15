// Test-only fictional checkout data. Not collected from any retailer.
// This module is NEVER imported by src/scan.mjs or src/publish.mjs.
export function fictionalOffer(now=Date.now(),overrides={}) {
  const checkedAt=new Date(now).toISOString();
  return {
    id:'fictional-gamestop-disc',retailer:'GameStop',
    url:'https://www.gamestop.com/consoles-hardware/playstation-5/consoles/products/fictional-ps5-slim-disc/422135.html',
    host:'www.gamestop.com',kind:'disc',source:'live-retailer-purchase-surface',
    checkedAt,exactModel:'Sony PS5 Slim Disc 1TB',
    skuOrBundle:'422135',condition:'NEW',conditionText:'Condition: New',
    seller:'GameStop',sellerText:'Sold by GameStop',
    shipper:'GameStop',shipperText:'Shipped by GameStop',
    controllers:1,storage:'1TB',discDrive:true,price:449,priceText:'$449.00',
    fulfillment:{
      confirmed:true,method:'ship-to-home',zip:'85001',
      text:'Ship to Home available, Phoenix ZIP 85001',
      locationText:'Shipping to Phoenix 85001',
      cartOrCheckoutConfirmed:true
    },
    checkoutEvidence:{
      url:'https://www.gamestop.com/cart',
      observedAt:checkedAt,skuOrBundle:'422135',priceText:'$449.00',
      zip:'85001',fulfillmentText:'Shipping to Phoenix 85001, orderable',
      orderable:true,
      itemText:'Sony PS5 Slim Disc 1TB SKU 422135 $449.00',
      selectedCondition:'NEW',selectedSeller:'GameStop',
      selectedFulfillmentMethod:'ship-to-home',checkoutControlEnabled:true
    },
    gameCredit:0,...overrides
  };
}
