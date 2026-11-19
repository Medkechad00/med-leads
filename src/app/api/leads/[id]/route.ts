import { NextRequest, NextResponse } from 'next/server';
import { authorized,isLiveConfigured,isSecureConfigured } from '@/lib/auth';
import { updateCrmLead } from '@/lib/sheets';
export const dynamic='force-dynamic';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!isLiveConfigured())return NextResponse.json({error:'Preview only. Connect Google Sheets to save changes.'},{status:409});
 if(!isSecureConfigured())return NextResponse.json({error:'Live security config missing'},{status:503});
 if(!(await authorized()))return NextResponse.json({error:'Authentication required'},{status:401});
 const {id}=await params;
 if(!/^(L\d+|DL-\d+|JI-\d+)$/.test(id))return NextResponse.json({error:'Invalid lead ID'},{status:400});
 try{
  const data=await req.json();
  if(!data || typeof data!=='object'||Array.isArray(data))throw new Error('Invalid update');
  const allowed=['status','nextAction','followUp','notes'];
  if(Object.keys(data).some(x=>!allowed.includes(x)))throw new Error('Unsupported field');
  await updateCrmLead(id,data);
  return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Update failed'},{status:400});}
}