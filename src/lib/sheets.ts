import { google } from 'googleapis';
import type { Activity, CrmData, Lead, LeadChange } from './types';

const SPREADSHEET=()=>process.env.GOOGLE_SHEET_ID!;
const SHEETS = {
 pipeline: 'PIPELINE',
 direct:'DIRECT CONTACT LEADS',
 job1:'JOB INTENT · BATCH 01',
 job2:'JOB INTENT · BATCH 02',
 activity:'OUTREACH LOG',
 updates:'CRM UPDATES'
};
function sheetsClient(){
 const auth=new google.auth.JWT({
  email:process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key:process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g,'\n'),
  scopes:['https://www.googleapis.com/auth/spreadsheets']
 });
 return google.sheets({version:'v4',auth});
}
const q=(name:string)=>`'${name.replace(/'/g,"''")}'`;
const rowVal=(r:string[],idx:number)=>String(r?.[idx]??'').trim();
const asScore=(v:string)=>{const n=Number(v);return Number.isFinite(n)&&v.trim()?n:null;};

function mapPipeline(rows:string[][]):Lead[]{return rows.slice(1).flatMap((r,i)=>{
 const id=rowVal(r,0);if(!/^L\d+/.test(id))return [];
 return [{id,company:rowVal(r,1),source:'Business prospects' as const,location:[rowVal(r,2),rowVal(r,3)].filter(Boolean).join(' · '),category:rowVal(r,4),score:asScore(rowVal(r,5)),status:rowVal(r,9)||'Not contacted',email:rowVal(r,7),contactChannel:rowVal(r,8),need:rowVal(r,14),nextAction:rowVal(r,13),followUp:rowVal(r,11),website:rowVal(r,16),originalSource:rowVal(r,16),evidence:rowVal(r,17),angle:rowVal(r,15),caution:rowVal(r,18),draft:'',notes:'',row:i+6,tab:SHEETS.pipeline,sentDate:rowVal(r,10)}];
});}
function mapDirect(rows:string[][]):Lead[]{return rows.slice(1).flatMap((r,i)=>{
 const id=rowVal(r,0);if(!/^DL-\d+/.test(id))return [];
 return [{id,company:rowVal(r,1),source:'Direct opportunities' as const,location:rowVal(r,2),category:'Direct project',score:null,status:rowVal(r,13)||'Draft only',email:rowVal(r,6),contactChannel:rowVal(r,9),need:rowVal(r,3),nextAction:'',followUp:'',website:'',originalSource:rowVal(r,8),evidence:rowVal(r,7),angle:rowVal(r,11),caution:[rowVal(r,12),rowVal(r,15)].filter(Boolean).join(' · '),draft:rowVal(r,14),notes:'',row:i+6,tab:SHEETS.direct,sentDate:''}];
});}
function mapJobs(rows:string[][],tab:string):Lead[]{return rows.slice(1).flatMap((r,i)=>{
 const id=rowVal(r,0);if(!/^JI-\d+/.test(id))return [];
 return [{id,company:rowVal(r,2),source:'Job intent' as const,location:rowVal(r,1),category:rowVal(r,3),score:asScore(rowVal(r,9)),status:rowVal(r,14)||'Needs review',email:rowVal(r,11),contactChannel:rowVal(r,10),need:rowVal(r,7),nextAction:rowVal(r,13),followUp:'',website:'',originalSource:rowVal(r,4),evidence:rowVal(r,16),angle:rowVal(r,12),caution:rowVal(r,17),draft:rowVal(r,15),notes:'',row:i+6,tab,sentDate:''}];
});}
function mapActivity(rows:string[][]):Activity[]{return rows.slice(1).flatMap(r=>{
 const id=rowVal(r,1);if(!id)return [];
 return [{date:rowVal(r,0),id,company:rowVal(r,2),subject:rowVal(r,4),channel:rowVal(r,5),status:rowVal(r,6),followUp:rowVal(r,8),thread:rowVal(r,7),note:rowVal(r,10)}];
});}
export async function readCrm():Promise<CrmData>{
 const api=sheetsClient();
 const ranges=[
  `${q(SHEETS.pipeline)}!A5:U300`,`${q(SHEETS.direct)}!A5:P150`,
  `${q(SHEETS.job1)}!A5:R130`,`${q(SHEETS.job2)}!A5:R130`,
  `${q(SHEETS.activity)}!A5:K300`,`${q('TOP 15 · PRIORITY')}!A1:Q100`
 ];
 const r=await api.spreadsheets.values.batchGet({spreadsheetId:SPREADSHEET(),ranges});
 const values=r.data.valueRanges?.map(v=>(v.values||[]) as string[][])||[];
 let leads=[...mapPipeline(values[0]||[]),...mapDirect(values[1]||[]),...mapJobs(values[2]||[],SHEETS.job1),...mapJobs(values[3]||[],SHEETS.job2)];
 // Some opportunities may be repeated between batch tabs. The canonical ID is unique.
 const known=new Set<string>();leads=leads.filter(l=>{if(known.has(l.id))return false;known.add(l.id);return true;});
 const priority=new Map<string,{score:number|null;nextAction:string}>();
 for(const r of (values[5]||[]).slice(1)){
  const id=rowVal(r,1);if(!id)continue;
  priority.set(id,{score:asScore(rowVal(r,14)),nextAction:rowVal(r,15)});
 }
 leads=leads.map(l=>{const p=priority.get(l.id);return p&&l.source==='Direct opportunities'?{...l,score:p.score??l.score,nextAction:p.nextAction||l.nextAction}:l;});
 try{
  const u=await api.spreadsheets.values.get({spreadsheetId:SPREADSHEET(),range:`${q(SHEETS.updates)}!A2:D2000`});
  const overrides=new Map<string,Partial<Lead>>();
  for(const r of (u.data.values||[]) as string[][]){const [id,field,value]=r;if(!['nextAction','followUp','notes','status'].includes(field)||!id)continue;
   overrides.set(id,{...(overrides.get(id)||{}),[field]:value});}
  leads=leads.map(l=>({...l,...(overrides.get(l.id)||{})}));
 }catch(err){
  // Newly connected legacy workbooks may not have CRM UPDATES yet. Ignore ONLY missing-tab errors.
  const msg=String(err);if(!/Unable to parse range|not found|400/.test(msg))throw err;
 }
 return {leads,activity:mapActivity(values[4]||[]),demo:false,connected:true,updatedAt:new Date().toISOString()};
}
async function ensureUpdatesSheet(){
 const api=sheetsClient();const id=SPREADSHEET();
 const meta=await api.spreadsheets.get({spreadsheetId:id,fields:'sheets.properties.title'});
 if(meta.data.sheets?.some(s=>s.properties?.title===SHEETS.updates))return;
 try{
  await api.spreadsheets.batchUpdate({spreadsheetId:id,requestBody:{requests:[{addSheet:{properties:{title:SHEETS.updates,gridProperties:{frozenRowCount:1}}}}]}});
  await api.spreadsheets.values.update({spreadsheetId:id,range:`${q(SHEETS.updates)}!A1:D1`,valueInputOption:'RAW',requestBody:{values:[['Lead ID','Field','Value','Updated at']]}});
 }catch(err){
  // Concurrent first writes might race; recheck before failing.
  const meta2=await api.spreadsheets.get({spreadsheetId:id,fields:'sheets.properties.title'});
  if(!meta2.data.sheets?.some(s=>s.properties?.title===SHEETS.updates))throw err;
 }
}
export async function updateCrmLead(id:string,change:LeadChange){
 const current=(await readCrm()).leads.find(l=>l.id===id);
 if(!current)throw new Error('Lead not found');
 if(current.tab==='DEMO')throw new Error('Preview mode');
 const api=sheetsClient();const spreadsheetId=SPREADSHEET();
 // Verify the target row still holds the same stable ID before writing.
 const row=await api.spreadsheets.values.get({spreadsheetId,range:`${q(current.tab)}!A${current.row}`});
 if(rowVal((row.data.values||[])[0] as string[],0)!==id)throw new Error('Sheet row changed; reload before updating');
 const updates: Array<{range:string;values:string[][]}>=[];
 const extra: string[][]=[];
 const native:Record<string,string> = current.tab===SHEETS.pipeline ? {status:'J',nextAction:'N',followUp:'L'} : current.tab===SHEETS.direct ? {status:'N'} : {status:'O',nextAction:'N'};
 for(const [field,value] of Object.entries(change)){
  if(!['status','nextAction','followUp','notes'].includes(field)||typeof value!=='string')continue;
  if(value.length>3000)throw new Error('Field too long');
  if(field==='status' && /not eligible|not suitable|excluded from direct outreach/i.test(current.status) && value!==current.status)throw new Error('This record is restricted; review eligibility in the Sheet before changing status');
  if(native[field])updates.push({range:`${q(current.tab)}!${native[field]}${current.row}`,values:[[value]]});
  else extra.push([id,field,value,new Date().toISOString()]);
 }
 if(!updates.length&&!extra.length)throw new Error('No editable changes');
 if(updates.length)await api.spreadsheets.values.batchUpdate({spreadsheetId,requestBody:{valueInputOption:'RAW',data:updates}});
 if(extra.length){await ensureUpdatesSheet();await api.spreadsheets.values.append({spreadsheetId,range:`${q(SHEETS.updates)}!A:D`,valueInputOption:'RAW',insertDataOption:'INSERT_ROWS',requestBody:{values:extra}});}
 return {success:true};
}