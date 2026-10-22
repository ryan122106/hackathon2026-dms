import { z } from 'zod';
const buckets=new Map<string,{count:number,reset:number}>();
export class RequestError extends Error { constructor(message:string,public status=400){super(message);} }
export async function readBody<T>(req:Request,schema:z.ZodType<T>):Promise<T>{
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new RequestError('Use application/json.',415);
 const origin=req.headers.get('origin');
 // Next may normalize req.url to localhost while the browser uses 127.0.0.1.
 // Compare the browser origin against the actual request Host header.
 if(origin){let originHost='';try{originHost=new URL(origin).host;}catch{throw new RequestError('Invalid origin.',403);}if(originHost!==(req.headers.get('host')||new URL(req.url).host))throw new RequestError('Cross-origin requests are not supported.',403);}
 const key=req.headers.get('x-forwarded-for')?.split(',')[0]?.slice(0,80)||'local';const now=Date.now();
 if(buckets.size>1000) for(const [k,v] of buckets) if(v.reset<now) buckets.delete(k);
 const bucket=buckets.get(key);if(bucket&&bucket.reset>now){if(bucket.count++>=60)throw new RequestError('Please wait a minute before trying again.',429);}else buckets.set(key,{count:1,reset:now+60000});
 if(Number(req.headers.get('content-length')||0)>160000)throw new RequestError('Request is too large.',413);
 const reader=req.body?.getReader();if(!reader)throw new RequestError('Request body required.');
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>160000){await reader.cancel();throw new RequestError('Request is too large.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 try{return schema.parse(JSON.parse(new TextDecoder().decode(bytes)));}catch{throw new RequestError('Invalid request. Check the input and try again.');}
}
export function apiError(error:unknown){return Response.json({error:error instanceof RequestError?error.message:'Unable to process request. Your data has not changed.'},{status:error instanceof RequestError?error.status:500});}
