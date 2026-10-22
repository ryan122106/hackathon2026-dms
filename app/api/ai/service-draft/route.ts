import { draftRequestSchema } from '@/lib/schemas';
import { extractionSchema,extractionInput,guidedDraft,liveDraft } from '@/lib/ai/service-draft';
import { modelJson,modelFallbackNotice } from '@/lib/ai/model-client';
import { complaintPrompt } from '@/lib/ai/prompts';
import { readBody,apiError } from '@/lib/ai/http';
export const runtime='nodejs';
export async function POST(req:Request){try{
 const {note,vehicle}=await readBody(req,draftRequestSchema);
 try{
 const extraction=await modelJson(complaintPrompt,{note:extractionInput(note),vehicle},extractionSchema);
 const draft=liveDraft(note,vehicle.make,extraction);
 return Response.json({draft,mode:'LIVE MODEL'});
 }catch(error){
 const draft=guidedDraft(note,vehicle.make);
 const notice=modelFallbackNotice(error);
 if(!draft)return Response.json({error:`${notice} No supported vehicle concern was extracted. Your original note is preserved; clarify the complaint and retry.`,mode:'GUIDED DEMO'},{status:422});
 return Response.json({draft,mode:'GUIDED DEMO',notice});
 }
 }catch(error){return apiError(error);}}
