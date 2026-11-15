// Sanitize public audit URLs. Never publish cookies, credentials, session
// tokens, tracking parameters, query strings, fragments or embedded passwords.
export function publicRetailerUrl(raw,expectedHost){
 try{
  const u=new URL(raw);
  if(u.protocol!=='https:' || u.hostname!==expectedHost || u.username || u.password)return null;
  u.search='';u.hash='';
  return u.href;
 }catch{return null;}
}
