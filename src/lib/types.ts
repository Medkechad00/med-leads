export type LeadSource = 'Business prospects' | 'Direct opportunities' | 'Job intent';
export type Lead = {
 id:string; company:string; source:LeadSource; location:string; category:string; score:number|null;
 status:string; email:string; contactChannel:string; need:string; nextAction:string; followUp:string;
 website:string; originalSource:string; evidence:string; angle:string; caution:string; draft:string; notes:string;
 row:number; tab:string; sentDate:string;
};
export type Activity={ date:string; id:string; company:string; subject:string; channel:string; status:string; followUp:string; thread:string; note:string; };
export type CrmData={ leads:Lead[]; activity:Activity[]; demo:boolean; connected:boolean; updatedAt:string; };
export type LeadChange={ status?:string; nextAction?:string; followUp?:string; notes?:string; };