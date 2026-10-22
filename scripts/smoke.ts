import assert from 'node:assert/strict';
import {createSeed} from '../lib/seed-data';
import {sanitizeSnapshot} from '../lib/schemas';
async function main(){
 const base='http://127.0.0.1:3001';
 const login=await fetch(`${base}/login`);assert.equal(login.status,200);assert.match(await login.text(),/Welcome back/);
 const response=await fetch(`${base}/api/ai/copilot`,{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({message:'Show low-stock parts',activePage:'/inventory',sanitizedSnapshot:sanitizeSnapshot(createSeed())})});
 assert.equal(response.status,200);const result=await response.json();assert.equal(result.mode,'GUIDED DEMO');assert.equal(result.cards.length,3);assert.equal(result.cards[0].id,'BRK-001');
 const draft=await fetch(`${base}/api/ai/service-draft`,{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({note:'Aircond not cold, brakes squeaking. Wants tomorrow morning.',vehicle:{make:'Honda',model:'City'}})});
 assert.equal(draft.status,200);const prepared=await draft.json();assert.equal(prepared.draft.complaints.length,2);assert.equal(prepared.draft.appointmentPreference,'Tomorrow morning');
 console.log('Production smoke passed: login, grounded inventory API and safe draft API.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
