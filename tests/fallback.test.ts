import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST as copilot} from '../app/api/ai/copilot/route';
import {POST as draft} from '../app/api/ai/service-draft/route';
import {createSeed} from '../lib/seed-data';
import {sanitizeSnapshot} from '../lib/schemas';
const snapshot=sanitizeSnapshot(createSeed());
function req(body:unknown){return new Request('http://localhost/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
test('expired credentials, quota, outages, timeout and bad output fall back once; next request can recover',async()=>{
 const oldKey=process.env.MODEL_API_KEY,oldFetch=global.fetch;process.env.MODEL_API_KEY='test-placeholder';
 const before=JSON.stringify(snapshot);
 try{
  for(const failure of [401,403,402,429,503,'timeout','invalid-output'] as const){
   let calls=0;
   global.fetch=async()=>{calls++;if(failure==='timeout')throw new DOMException('timed out','TimeoutError');if(failure==='invalid-output')return Response.json({choices:[{message:{content:'not valid JSON'}}]});return Response.json({error:{message:'private upstream text'}},{status:failure});};
   let result=await(await copilot(req({message:'What questions should I ask about engine spoil?',activePage:'/dashboard',sanitizedSnapshot:snapshot}))).json();
   assert.equal(result.mode,'GUIDED DEMO',String(failure));assert.match(result.message,/stall|noise/);assert.ok(result.notice);assert.equal(calls,1,'No second model request after failure');assert.doesNotMatch(JSON.stringify(result),/private upstream text|test-placeholder/);
   calls=0;
   result=await(await draft(req({note:'aircond not working, engine spoil',vehicle:{make:'Honda',model:'City'}}))).json();
   assert.equal(result.mode,'GUIDED DEMO');assert.equal(result.draft.complaints.length,2);assert.equal(calls,1);
  }
  global.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({kind:'help.converse',topic:'workflow',answer:'Ready means the vehicle is ready for customer collection.'})}}]});
  const recovered=await(await copilot(req({message:'What does Ready mean?',activePage:'/dashboard',sanitizedSnapshot:snapshot}))).json();
  assert.equal(recovered.mode,'LIVE MODEL');assert.match(recovered.message,/collection/);assert.equal(JSON.stringify(snapshot),before);
 }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=oldKey;}
});
