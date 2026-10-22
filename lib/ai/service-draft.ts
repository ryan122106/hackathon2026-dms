import { z } from 'zod';
import { draftSchema, type ServiceDraft } from '../schemas';
import { redactModelText } from './redaction';

const categories=['ac','brakes','engine','maintenance','battery','tyres','transmission','other'] as const;
type Category=typeof categories[number];
export const extractionSchema=z.object({
  concerns:z.array(z.object({sourceQuote:z.string().trim().min(2).max(400),category:z.enum(categories)}).strict()).min(1).max(12),
  appointmentPreference:z.string().trim().min(2).max(300).nullable(),
}).strict();
type Extraction=z.infer<typeof extractionSchema>;
const concernPatterns:Record<Exclude<Category,'other'>,RegExp>={
  ac:/\baircond\b|\bac\b|air.?con(?:ditioning)?|a\/c|\bnot (?:cold|cooling)\b|tak sejuk/i,
  brakes:/\bbrak(?:e|es|ing)?\b|squeak|\bbreaks?\s+(?:noise|not working)|\bbrek\b/i,
  engine:/\bengine\b|\benjin\b|\bmotor\s+(?:spoil|rosak)/i,
  maintenance:/maintenance|routine service|scheduled service/i,
  battery:/\bbatter(?:y|ies)\b|\bbateri\b/i,
  tyres:/\b(?:tyres?|tires?|tayar)\b/i,
  transmission:/transmission|gearbox|gear (?:shift|not|stuck)/i,
};
const instructionPattern=/ignore.{0,30}(?:instructions|rules|policy)|(?:system|developer)\s*:|<\/?(?:system|developer)>|\[\/?INST\]|\b(?:buy|purchase|delete|approve|reveal|execute|eval)\b|api\s*key|\b(?:sql|javascript)\b/i;
export function mismatchFlag(note:string,make:string){
  const other=['Honda','Toyota','Perodua','Proton'].find(m=>m.toLowerCase()!==make.toLowerCase()&&new RegExp(`\\b${m}\\b`,'i').test(note));
  return other?`Vehicle mismatch: note mentions ${other}; selected vehicle remains ${make}. Clarify with customer.`:null;
}
function cleanNote(note:string){
  return redactModelText(note).split(/[,;\n]+|(?<=[.!?])\s+|\s+(?:and|dan)\s+/i)
    .map(s=>s.trim()).filter(Boolean).filter(s=>!instructionPattern.test(s));
}
function recognized(note:string):Extraction['concerns']{
  const result:Extraction['concerns']=[];
  for(const clause of cleanNote(note))for(const [category,pattern] of Object.entries(concernPatterns)){
    if(pattern.test(clause)&&!result.some(c=>c.category===category&&c.sourceQuote===clause))result.push({sourceQuote:clause.slice(0,400),category:category as Category});
  }
  return result;
}
function symptom(category:Category,quote:string){
  if(category==='ac')return /not (?:cold|cool)|tak sejuk/i.test(quote)?'A/C not cooling':'A/C not working (customer-reported)';
  if(category==='brakes')return /noise|squeak|bunyi/i.test(quote)?'Noise reported during braking':'Brake operation concern reported';
  if(category==='engine')return /engine noise|enjin.*bunyi/i.test(quote)?'Engine noise reported':/not start|won.t start|cannot start|tak.*start/i.test(quote)?'Engine not starting (customer-reported)':'Engine problem reported by customer (unverified)';
  if(category==='maintenance')return 'Scheduled maintenance requested';
  if(category==='battery')return 'Battery concern reported by customer (unverified)';
  if(category==='tyres')return 'Tyre concern reported by customer (unverified)';
  if(category==='transmission')return 'Transmission concern reported by customer (unverified)';
  return `Customer reports: “${quote.slice(0,330)}” (unverified)`;
}
const inspections:Record<Category,string>={
  ac:'Inspect A/C cooling performance',brakes:'Inspect brake system and investigate the reported concern',
  engine:'Inspect engine operation and investigate the reported concern',maintenance:'Inspect vehicle according to maintenance schedule',
  battery:'Inspect battery condition and starting system',tyres:'Inspect tyre condition and reported concern',
  transmission:'Inspect transmission operation and reported concern',other:'Inspect and clarify the reported vehicle concern',
};
function compose(note:string,make:string,concerns:Extraction['concerns'],preference:string|null,live:boolean):ServiceDraft{
  const unique=concerns.filter((c,i,a)=>a.findIndex(v=>v.category===c.category&&v.sourceQuote.toLowerCase()===c.sourceQuote.toLowerCase())===i);
  if(!unique.length)throw new Error('No supported concerns');
  const has=(category:Category)=>unique.some(c=>c.category===category);const mismatch=mismatchFlag(note,make);
  const uncovered=unique.length>12||cleanNote(note).some(clause=>! /tomorrow|morning|appointment|(?:wants?|come|visit).*(?:today|time)|\b(?:today|petang|esok)\b/i.test(clause)&&!unique.some(c=>c.sourceQuote.toLowerCase().includes(clause.toLowerCase())||clause.toLowerCase().includes(c.sourceQuote.toLowerCase())));
  return draftSchema.parse({
    complaints:[...new Set(unique.map(c=>c.category==='other'?symptom(c.category,c.sourceQuote):`${symptom(c.category,c.sourceQuote)} — Customer words: “${c.sourceQuote.slice(0,220)}”`))].slice(0,12),
    inspectionTasks:[...new Set(unique.map(c=>inspections[c.category]))].slice(0,12),
    missingInformation:['When did the concern first occur?',...(has('brakes')?['Under what conditions does the brake noise occur?']:[]),...(has('engine')?['What does the reported engine problem mean: not starting, stalling, noise, loss of power or another symptom?']:[]),...(preference?['What date and time does the customer prefer?']:[])],
    safetyFlags:[...(has('brakes')?['Brake complaint needs qualified technician review']:[]),...(has('engine')?['Engine concern is customer-reported; no component failure or diagnosis has been confirmed.']:[]),...(mismatch?[mismatch]:[]),...(instructionPattern.test(note)?['Embedded instructions were ignored. Original note retained for advisor review.']:[]),...(uncovered?['Some original note text is not represented in the structured concerns. Review and add any missing complaint before saving.']:[])],
    appointmentPreference:preference,
    advisorSummary:live?'Source-grounded model extraction with application-controlled inspection suggestions. Advisor review is required.':'Guided example extraction. Verify against the original customer note; no diagnosis, cost or booking is confirmed.',
  });
}
function guidedPreference(note:string){return /tomorrow morning/i.test(note)?'Tomorrow morning':/tomorrow/i.test(note)?'Tomorrow (time unconfirmed)':null;}
export function guidedDraft(note:string,make:string):ServiceDraft|null{
  const concerns=recognized(note);if(!concerns.length)return null;
  return compose(note,make,concerns,guidedPreference(note),false);
}
export function liveDraft(note:string,make:string,extraction:Extraction):ServiceDraft{
  const sanitized=redactModelText(note).toLowerCase();
  const concerns=extraction.concerns.map(c=>{
    if(!sanitized.includes(c.sourceQuote.toLowerCase())||instructionPattern.test(c.sourceQuote))throw new Error('Ungrounded or instructional evidence');
    if(c.category!=='other'&&!concernPatterns[c.category].test(c.sourceQuote))return {...c,category:'other' as const};
    return c;
  });
  // Preserve explicit known concerns even if the model omitted a category.
  for(const explicit of recognized(note))if(!concerns.some(c=>c.category===explicit.category&&(c.sourceQuote.toLowerCase().includes(explicit.sourceQuote.toLowerCase())||explicit.sourceQuote.toLowerCase().includes(c.sourceQuote.toLowerCase()))))concerns.push(explicit);
  if(concerns.length>12)throw new Error('Too many concerns');
  const preference=extraction.appointmentPreference;
  if(preference&&!sanitized.includes(preference.toLowerCase()))throw new Error('Ungrounded preference');
  return validateDraftSafety(compose(note,make,concerns,preference||guidedPreference(note),true));
}
export function extractionInput(note:string){return cleanNote(note).join('; ');}
export function validateDraftSafety(d:ServiceDraft){
  if(d.inspectionTasks.some(t=>!Object.values(inspections).includes(t)))throw new Error('Non-allowlisted inspection');
  const generated=[...d.inspectionTasks,...d.missingInformation,...d.safetyFlags,d.advisorSummary,d.appointmentPreference||''].join(' ');
  if(/(?:RM|\$|MYR)\s*\d|\b(?:replace|replacement|guaranteed|diagnosed|diagnosis is|booking confirmed|warranty approved)\b/i.test(generated))throw new Error('Unsafe draft');
  return d;
}
