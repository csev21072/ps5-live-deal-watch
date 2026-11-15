// A retailer redirect must never be treated as the original purchase surface.
// Keep exact-host matching: no lookalike subdomains, logins or third-party carts.
export function validateRetailerOrigin(finalUrl,product){
  let u;
  try{u=new URL(finalUrl);}catch{return {valid:false,reason:'invalid-final-url'};}
  if(u.protocol!=='https:'||u.username||u.password)
    return {valid:false,reason:'insecure-or-credentialed-final-url'};
  if(u.hostname!==product?.host)
    return {valid:false,reason:'redirected-off-expected-retailer'};
  if(/\/(?:captcha|challenge|login|signin|sign-in|account\/login)(?:\/|$)/i.test(u.pathname))
    return {valid:false,reason:'login-or-challenge-page'};
  return {valid:true,reason:'exact-retailer-origin'};
}
