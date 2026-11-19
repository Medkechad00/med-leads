import { NextResponse } from 'next/server';
import { authorized,isLiveConfigured,isSecureConfigured } from '@/lib/auth';
import { readCrm } from '@/lib/sheets';
import { demoData } from '@/lib/demo';
export const dynamic='force-dynamic';
export async function GET(){
 if(!isSecureConfigured())return NextResponse.json({error:'Workspace not configured. Set ADMIN_PASSWORD and SESSION_SECRET before accessing the CRM.'},{status:503,headers:{'Cache-Control':'no-store'}});
 if(!(await authorized()))return NextResponse.json({error:'Authentication required',authRequired:true},{status:401,headers:{'Cache-Control':'no-store'}});
 if(!isLiveConfigured()) {
  if(process.env.DEMO_MODE==='true')return NextResponse.json({...demoData,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'no-store, private'}});
  return NextResponse.json({error:'Google Sheets is not configured. Set the service account credentials or explicitly enable DEMO_MODE=true.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
 try{const data=await readCrm();return NextResponse.json(data,{headers:{'Cache-Control':'no-store, private'}});}
 catch(e){console.error('Google Sheets read failed',e);return NextResponse.json({error:'Unable to read Google Sheets. Check service account permissions and workbook ID.'},{status:502});}
}