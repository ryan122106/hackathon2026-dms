import { copilotRequestSchema, intentSchema } from '@/lib/schemas';
import { executeRead, guidedIntent, guidedConversation, unsafeRequest, guardrailReply } from '@/lib/copilot';
import { modelJson,modelFallbackNotice } from '@/lib/ai/model-client';
import { copilotPrompt } from '@/lib/ai/prompts';
import { validateConversation } from '@/lib/ai/conversation';
import { readBody, apiError } from '@/lib/ai/http';
export const runtime='nodejs';
export async function POST(req:Request){try{
 const input=await readBody(req,copilotRequestSchema);const {message,activeOrderId,sanitizedSnapshot}=input;
 if(unsafeRequest(message))return Response.json({message:guardrailReply(message),cards:[],mode:'APP GUARDRAIL'});
 let intent=guidedIntent(message,sanitizedSnapshot,activeOrderId);let mode:'GUIDED DEMO'|'LIVE MODEL'='GUIDED DEMO';
 let notice:string|undefined;
 try{intent=await modelJson(copilotPrompt,{message,history:input.history||[],activePage:input.activePage,activeOrderId,today:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur'}).format(new Date())},intentSchema);mode='LIVE MODEL';}catch(error){notice=modelFallbackNotice(error);}
 // The same validated model response contains the conversational answer; no second network call.
 if(intent.kind==='help.converse'||intent.kind==='help.unsupported'){
   if(mode==='GUIDED DEMO')return Response.json({message:guidedConversation(message),cards:[],mode,provenance:'APP HELP',notice});
   try{
     const answer=validateConversation(intent.kind==='help.converse'?intent.answer:intent.reason);
     return Response.json({message:answer,cards:[],mode:'LIVE MODEL',provenance:'AI GENERAL GUIDANCE'});
   }catch(error){
     return Response.json({message:guidedConversation(message),cards:[],mode:'GUIDED DEMO',provenance:'APP HELP',notice:modelFallbackNotice(error)});
   }
 }
 const result=executeRead(intent,sanitizedSnapshot,mode,activeOrderId);
 if(/pending/i.test(message)&&intent.kind==='orders.find')result.message='“Pending” is interpreted as Open; there is no Pending status. '+result.message;
 return Response.json({...result,notice});
 }catch(error){return apiError(error);}}
