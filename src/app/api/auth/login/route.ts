import { NextRequest, NextResponse } from 'next/server';
import { checkPassword,cookieOptions,COOKIE,isSecureConfigured,makeSession } from '@/lib/auth';
let attempts=new Map<string,{count:number,until:number}>();
export async function POST(req:NextRequest){
 if(!isSecureConfigured())return NextResponse.json({error:'Workspace authentication is not configured yet. Set ADMIN_PASSWORD and SESSION_SECRET.'},{status:503});
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
 const now=Date.now();const previous=attempts.get(ip)||{count:0,until:0};
 if(previous.until>now)return NextResponse.json({error:'Too many attempts. Try again later.'},{status:429});
 let pwd='';try{pwd=String((await req.json()).password||'');}catch{}
 if(!checkPassword(pwd)){
  const count=previous.count+1;attempts.set(ip,{count:count>=8?0:count,until:count>=8?now+15*60*1000:0});
  if(attempts.size>500)attempts=new Map();
  return NextResponse.json({error:'Incorrect password'},{status:401});
 }
 attempts.delete(ip);
 const res=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});res.cookies.set(COOKIE,makeSession(),cookieOptions());return res;
}