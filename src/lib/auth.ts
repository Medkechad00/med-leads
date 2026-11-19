import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
const COOKIE='meds_crm_session';
const WEEK=7*24*60*60*1000;
export const isLiveConfigured=()=>Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID);
export const isSecureConfigured=()=>Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length>=24);
const sign=(s:string)=>createHmac('sha256',process.env.SESSION_SECRET||'').update(s).digest('hex');
export function makeSession(){const value=`${Date.now()}`;return `${value}.${sign(value)}`;}
export function checkPassword(input:string){
 const secret=process.env.ADMIN_PASSWORD||'';
 if(!secret || !input || input.length>512)return false;
 const a=createHmac('sha256','crm-password').update(input).digest();
 const b=createHmac('sha256','crm-password').update(secret).digest();
 return timingSafeEqual(a,b);
}
export async function authorized(){
 if(!isSecureConfigured())return false;
 const cookie=(await cookies()).get(COOKIE)?.value||'';
 const dot=cookie.indexOf('.');if(dot<0)return false;
 const timestamp=cookie.slice(0,dot);const sig=cookie.slice(dot+1);
 if(!/^\d{13}$/.test(timestamp)|| !/^[0-9a-f]{64}$/.test(sig))return false;
 const age=Date.now()-Number(timestamp);
 if(age<0||age>WEEK)return false;
 return timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(sign(timestamp),'hex'));
}
export function cookieOptions(){return {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:7*24*60*60};}
export {COOKIE};