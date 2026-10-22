import { z } from 'zod';
import { redactModelText } from './redaction';

export class ModelError extends Error {
  constructor(public readonly code:'missing-key'|'configuration'|'authentication'|'quota'|'unavailable'|'invalid-output',public readonly status?:number,public readonly responseFormat?:'json'|'other') {super(code);}
}
// Never expose upstream errors, response bodies or credentials to the browser.
export function modelFallbackNotice(error:unknown):string {
  if(error instanceof ModelError) {
    if(error.code==='missing-key')return 'Live AI is not configured. Using guided mode.';
    if(error.code==='configuration')return 'Check the server-side provider URL, allowed origin and HTTP opt-in settings. Using guided mode.';
    if(error.code==='authentication')return 'The model provider rejected API access. Check the credentials, provider URL and model in .env.local, then restart the server. Using guided mode.';
    if(error.code==='quota')return 'Provider credits or rate limits prevented this request. Using guided mode.';
    if(error.code==='invalid-output')return 'The model response did not pass validation. Using guided mode.';
  }
  return 'Live AI was unavailable or its response failed safety checks. Using guided mode.';
}
export async function modelJson<T>(instruction:string,data:unknown,schema:z.ZodType<T>):Promise<T> {
  const key=process.env.MODEL_API_KEY?.trim();
  if(!key)throw new ModelError('missing-key');
  let base:URL;
  try{base=new URL(process.env.MODEL_API_BASE_URL||'https://api.meta.ai/v1');}catch{throw new ModelError('configuration');}
  const provider=process.env.MODEL_PROVIDER||'meta';
  if(!['meta','custom'].includes(provider)||!/^\/v1\/?$/.test(base.pathname)||base.username||base.password||base.search||base.hash)throw new ModelError('configuration');
  if(provider==='meta'&&base.origin!=='https://api.meta.ai')throw new ModelError('configuration');
  if(provider==='custom'){
    // Only the operator's pinned server configuration chooses a destination; never model/user input.
    if(base.origin!==process.env.MODEL_API_ALLOWED_ORIGIN)throw new ModelError('configuration');
    if(base.protocol!=='https:'&&!(base.protocol==='http:'&&process.env.MODEL_ALLOW_INSECURE_HTTP==='true'))throw new ModelError('configuration');
  }
  const sanitized=JSON.parse(JSON.stringify(data,(_key,value)=>typeof value==='string'?redactModelText(value):value));
  let response:Response;
  try {
    response=await fetch(`${base.href.replace(/\/$/,'')}/chat/completions`,{
      method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
      signal:AbortSignal.timeout(20000),cache:'no-store',redirect:'error',
      body:JSON.stringify({model:process.env.MODEL_ID||'muse-spark-1.3',messages:[
        {role:provider==='custom'?'system':'developer',content:instruction+' Return only a JSON object matching this JSON schema: '+JSON.stringify(z.toJSONSchema(schema))},
        {role:'user',content:JSON.stringify(sanitized)},
      ],response_format:{type:'json_object'},...(provider==='custom'?{max_tokens:4096}:{max_completion_tokens:4096})}),
    });
  }catch{throw new ModelError('unavailable');}
  const format=response.headers.get('content-type')?.includes('json')?'json':'other';
  if([401,403].includes(response.status))throw new ModelError('authentication',response.status,format);
  if([402,429].includes(response.status))throw new ModelError('quota',response.status,format);
  if(!response.ok)throw new ModelError('unavailable',response.status,format);
  try {
    const payload=await response.json();const content=payload.choices?.[0]?.message?.content;
    if(typeof content!=='string'||content.length>64000)throw new Error('Invalid content');
    return schema.parse(JSON.parse(content));
  }catch{throw new ModelError('invalid-output');}
}
