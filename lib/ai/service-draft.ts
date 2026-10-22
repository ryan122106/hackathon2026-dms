import type { ServiceDraft } from '../schemas';
export function mismatchFlag(note:string,make:string){const other=['Honda','Toyota','Perodua','Proton'].find(m=>m.toLowerCase()!==make.toLowerCase()&&new RegExp(`\\b${m}\\b`,'i').test(note));return other?`Vehicle mismatch: note mentions ${other}; selected vehicle remains ${make}. Clarify with customer.`:null;}
export function guidedDraft(note:string,make:string):ServiceDraft|null{
 const ac=/aircond|air.?con(?:ditioning)?|a\/c|not (?:cold|cooling)/i.test(note);const brakes=/brak|squeak/i.test(note);const engine=/engine noise/i.test(note);const maintenance=/maintenance|routine service/i.test(note);
 if(!ac&&!brakes&&!engine&&!maintenance)return null;
 const mismatch=mismatchFlag(note,make);
 return {complaints:[...(ac?['A/C not cooling']:[]),...(brakes?['Noise reported during braking']:[]),...(engine?['Engine noise reported']:[]),...(maintenance?['Scheduled maintenance requested']:[])],inspectionTasks:[...(ac?['Inspect A/C cooling performance']:[]),...(brakes?['Inspect brake system and investigate reported noise']:[]),...(engine?['Inspect and investigate reported engine noise']:[]),...(maintenance?['Inspect vehicle according to maintenance schedule']:[])],missingInformation:['When did the concern first occur?',...(brakes?['Under what conditions does the brake noise occur?']:[]),...(/tomorrow/i.test(note)?['What date and time does the customer prefer?']:[])],safetyFlags:[...(brakes?['Brake complaint needs qualified technician review']:[]),...(mismatch?[mismatch]:[]),...(/system\s*:|ignore|buy|purchase/i.test(note)?['Embedded instructions were ignored. Original note retained for advisor review.']:[])],appointmentPreference:/tomorrow morning/i.test(note)?'Tomorrow morning':/tomorrow/i.test(note)?'Tomorrow (time unconfirmed)':null,advisorSummary:'Guided example extraction. Verify against the original customer note; no diagnosis, cost or booking is confirmed.'};
}
export function validateDraftSafety(d:ServiceDraft){
 const all=[...d.complaints,...d.inspectionTasks,...d.missingInformation,...d.safetyFlags,d.advisorSummary,d.appointmentPreference||''].join(' ');
 if(/(?:RM|\$|MYR)\s*\d|\b(?:defective|failed|broken|replace|replacement|guaranteed|diagnosed|diagnosis is|booked|booking confirmed|warranty approved)\b/i.test(all))throw new Error('Unsafe draft');
 if(d.inspectionTasks.some(t=>! /^(inspect|check|assess|investigate|verify|review|ask|confirm)\b/i.test(t)))throw new Error('Inspection-only tasks required');
 return d;
}
