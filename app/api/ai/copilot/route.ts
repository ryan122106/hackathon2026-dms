import { copilotRequestSchema, intentSchema } from '@/lib/schemas';
import { executeRead, guidedIntent, unsafeRequest, refusal } from '@/lib/copilot';
import { modelJson } from '@/lib/ai/model-client';
import { readBody, apiError } from '@/lib/ai/http';
export const runtime='nodejs';
export async function POST(req:Request){try{
 const input=await readBody(req,copilotRequestSchema);const {message,activeOrderId,sanitizedSnapshot}=input;
 if(unsafeRequest(message))return Response.json({message:refusal,cards:[],mode:'GUIDED DEMO'});
 let intent=guidedIntent(message,sanitizedSnapshot,activeOrderId);let mode:'GUIDED DEMO'|'LIVE MODEL'='GUIDED DEMO';
 try{intent=await modelJson('Classify one read-only DMS intent. Never execute writes. Pending means Open, explain mapping. No diagnoses, prices or bookings. Return help.unsupported for requests outside allowed intents. Only use exact IDs from the message or active order context.',{message,activePage:input.activePage,activeOrderId,today:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur'}).format(new Date())},intentSchema);mode='LIVE MODEL';}catch{/* Safe, visibly labelled fallback. */}
 const result=executeRead(intent,sanitizedSnapshot,mode,activeOrderId);
 if(intent.kind==='help.unsupported'&&mode==='GUIDED DEMO')result.message=intent.reason;
 if(/pending/i.test(message)&&intent.kind==='orders.find')result.message='“Pending” is interpreted as Open; there is no Pending status. '+result.message;
 return Response.json(result);
 }catch(error){return apiError(error);}}
