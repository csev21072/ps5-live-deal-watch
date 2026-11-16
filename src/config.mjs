// Public retailer-owned pages only. No affiliate, feed, or scraped price URLs.
// Update these URLs when a retailer replaces a product/SKU.
export const RETAILER_HOSTS=Object.freeze({
  'PlayStation Direct':['direct.playstation.com'],
  'Best Buy':['www.bestbuy.com'],
  'Target':['www.target.com'],
  'Walmart':['www.walmart.com'],
  'Amazon':['www.amazon.com'],
  'GameStop':['www.gamestop.com'],
  'Costco':['www.costco.com','sameday.costco.com']
});
export const ZIP = '85001';
export const MAX_AGE_MS = 10 * 60 * 1000;
export const products = [
  {id:'psdirect-disc',retailer:'PlayStation Direct',kind:'disc',url:'https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb',host:'direct.playstation.com'},
  {id:'psdirect-digital',retailer:'PlayStation Direct',kind:'digital',url:'https://direct.playstation.com/en-us/buy-consoles/playstation5-digital-edition-console-825-gb',host:'direct.playstation.com'},
  {id:'bestbuy-disc',retailer:'Best Buy',kind:'disc',url:'https://www.bestbuy.com/product/playstation-5-slim-console/JXHQ3CCTYR/sku/6566039',host:'www.bestbuy.com'},
  {id:'bestbuy-digital',retailer:'Best Buy',kind:'digital',url:'https://www.bestbuy.com/product/playstation-5-slim-console-digital-edition-825gb/JXHQ37TYYL',host:'www.bestbuy.com'},
  {id:'target-disc-bundle',retailer:'Target',kind:'disc',url:'https://www.target.com/p/playstation-5-nba-2k26-disc-bundle-console/-/A-94907150',host:'www.target.com'},
  {id:'target-digital-bundle',retailer:'Target',kind:'digital',url:'https://www.target.com/p/-/A-93150909',host:'www.target.com'},
  {id:'walmart-disc',retailer:'Walmart',kind:'disc',url:'https://www.walmart.com/ip/17816601985',host:'www.walmart.com'},
  {id:'amazon-disc',retailer:'Amazon',kind:'disc',url:'https://www.amazon.com/dp/B0FRGTYSL5',host:'www.amazon.com'},
  {id:'gamestop-disc-bundle',retailer:'GameStop',kind:'disc',url:'https://www.gamestop.com/consoles-hardware/playstation-5/consoles/products/sony-playstation-5-console-disc-edition---astro-bot-bundle/422135.html',host:'www.gamestop.com'},
  {id:'gamestop-digital-bundle',retailer:'GameStop',kind:'digital',url:'https://www.gamestop.com/consoles-hardware/playstation-5/consoles/products/sony-playstation-5-slim-digital-edition---fortnite-cobalt-star-bundle/20016240.html',host:'www.gamestop.com'},
  // Direct GameStop product URLs discovered 2026-11-16; discovery does not imply availability.
  {id:'gamestop-disc-cobalt-star',retailer:'GameStop',kind:'disc',url:'https://www.gamestop.com/consoles-hardware/playstation-5/consoles/products/sony-playstation-5-slim-console-disc-edition---fortnite-cobalt-star-bundle/20016239.html',host:'www.gamestop.com'},
  {id:'gamestop-digital-flowering-chaos',retailer:'GameStop',kind:'digital',url:'https://www.gamestop.com/consoles-hardware/playstation-5/consoles/products/sony-playstation-5-slim-console-digital-edition---fortnite-flowering-chaos-bundle/20028327.html',host:'www.gamestop.com'},
  {id:'costco-disc-two-controller',retailer:'Costco',kind:'disc',url:'https://sameday.costco.com/store/costco/products/83457876-sony-playstation-5-slim-disc-console-dualsense-controller-bundle',host:'sameday.costco.com'},
  {id:'costco-digital-two-controller',retailer:'Costco',kind:'digital',url:'https://sameday.costco.com/store/costco/products/94684554-sony-playstation-5-digital-slim-console-dualsense-controller-bundle',host:'sameday.costco.com'}
];
export const priceSelectors = {
  'Amazon': ['#corePrice_feature_div .a-price .a-offscreen','#apex_desktop .a-price .a-offscreen'],
  'Best Buy': ['.priceView-customer-price span','[data-testid="customer-price"]'],
  'Target': ['[data-test="product-price"]','[data-test="current-price"]'],
  'Walmart': ['[itemprop="price"]','[data-testid="price-wrap"]'],
  'GameStop': ['.actual-price','.price'],
  'Costco': ['.product-price','.price'],
  'PlayStation Direct': ['[data-qa="product-price"]','.product-price']
};
