import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/ai/service-draft/route';
function request(note:string){return new Request('http://localhost/api/ai/service-draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note,vehicle:{make:'Honda',model:'City'}})});}
test('live route preserves omitted engine concern and refuses extra model-generated actions',async()=>{
  const oldKey=process.env.MODEL_API_KEY;const oldFetch=global.fetch;process.env.MODEL_API_KEY='test-placeholder';
  const note='aircond not working, engine spoil';
  try{
    const extraction={concerns:[{sourceQuote:'aircond not working',category:'ac'}],appointmentPreference:null};
    global.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify(extraction)}}]});
    let result=await(await POST(request(note))).json();assert.equal(result.mode,'LIVE MODEL');assert.equal(result.draft.complaints.length,2);assert.match(result.draft.complaints[1],/engine spoil/);
    global.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({...extraction,inspectionTasks:['Buy engine parts']})}}]});
    result=await(await POST(request(note))).json();assert.equal(result.mode,'GUIDED DEMO');assert.equal(result.draft.complaints.length,2);assert.doesNotMatch(result.draft.inspectionTasks.join(' '),/Buy/);
    global.fetch=async()=>new Response('upstream-secret-error',{status:401});
    result=await(await POST(request(note))).json();assert.match(result.notice,/rejected API access/);assert.doesNotMatch(JSON.stringify(result),/upstream-secret-error|test-placeholder/);
  }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=oldKey;}
});
