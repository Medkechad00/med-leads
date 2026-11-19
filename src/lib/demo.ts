import type { CrmData, Lead } from './types';
// Clearly fictional records only: NEVER replace live Sheets data with these when credentials exist.
const records: Array<[string,string,Lead['source'],string,string,number,string,string,string,string,string]> = [
 ['L-001','Northstar Dental','Business prospects','Dubai · JLT','Dental clinic',91,'Sent','Administrative booking requests','2026-11-23','WhatsApp intake','UAE'],
 ['L-002','The Aesthetic Room','Business prospects','London · UK','Aesthetic clinic',89,'Interested','Consultation follow-up','2026-11-20','AI receptionist','UK'],
 ['DL-003','BrightPath Studio','Direct opportunities','Remote','Web development',88,'Draft only','Next.js dashboard & integrations','2026-11-24','Custom SaaS MVP','Remote'],
 ['L-004','CoolCare Services','Business prospects','Dubai · Marina','AC service',85,'Sent','Service request triage','2026-11-22','AI phone intake','UAE'],
 ['DL-005','PixelWorks Agency','Direct opportunities','Remote','E-commerce',84,'Needs verification','Shopify development','2026-11-26','Modern storefront','Remote'],
 ['L-006','Harbour Dental','Business prospects','Manchester · UK','Dental clinic',82,'Meeting booked','Reception overflow','2026-11-21','Booking assistant','UK'],
 ['L-007','Elm Beauty Collective','Business prospects','Birmingham · UK','Beauty salon',80,'Not contacted','Missed enquiry handling','2026-11-25','WhatsApp lead agent','UK'],
 ['JI-008','Buildflow Labs','Job intent','Remote','Automation',79,'Review eligibility','API automation & webhooks','','n8n workflows','Remote'],
 ['L-009','SwiftFix Repairs','Business prospects','London · UK','Home services',76,'Replied','Phone and form intake','2026-11-20','AI voice receptionist','UK'],
 ['DL-010','LaunchCraft','Direct opportunities','Remote','SaaS',75,'Draft only','Full-stack implementation','2026-11-27','Next.js web app','Remote'],
 ['L-011','Naya Skin Studio','Business prospects','Dubai · Business Bay','Aesthetic clinic',73,'Not contacted','Appointment intake','2026-11-28','WhatsApp scheduling','UAE'],
 ['L-012','Oak & Ivy Dental','Business prospects','Liverpool · UK','Dental clinic',71,'Sent','Staff-approved booking','2026-11-21','Appointment assistant','UK'],
];
export const demoData: CrmData = {
 demo:true, connected:false, updatedAt:new Date().toISOString(),
 leads: records.map(([id,company,source,location,category,score,status,need,followUp,angle],i):Lead=>({
 id,company,source,location,category,score,status,email:'',contactChannel:'Demo record',need,nextAction: status==='Sent'?'Check for a reply':'Review opportunity and prepare next step',followUp,website:'',originalSource:'',evidence:'',angle,caution:'Fictional preview record. Connect the real Google Sheet to work with your leads.',draft:'',notes:'',row:i+6,tab:'DEMO',sentDate:status==='Sent'?'2026-11-18':''
 })),
 activity:[
  {date:'2026-11-18',id:'L-001',company:'Northstar Dental',subject:'Demo outreach',channel:'Email',status:'Sent',followUp:'2026-11-23',thread:'',note:'Fictional preview'},
  {date:'2026-11-18',id:'L-004',company:'CoolCare Services',subject:'Demo outreach',channel:'Email',status:'Sent',followUp:'2026-11-22',thread:'',note:'Fictional preview'},
  {date:'2026-11-17',id:'L-012',company:'Oak & Ivy Dental',subject:'Demo outreach',channel:'Email',status:'Sent',followUp:'2026-11-21',thread:'',note:'Fictional preview'}
 ]
};