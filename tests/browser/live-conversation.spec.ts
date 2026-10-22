import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('live conversation answers normal questions, follows context and searches actual stock',async({page})=>{
  test.skip(process.env.RUN_LIVE_PROVIDER!=='1','Explicit opt-in for fictional live-provider requests.');
  test.setTimeout(180000);
  await page.goto('/login');await page.getByRole('button',{name:'Continue as Demo Advisor'}).click();
  await page.getByRole('button',{name:'Ask Copilot',exact:true}).click();
  async function ask(message:string){
    const response=page.waitForResponse(r=>r.url().includes('/api/ai/copilot')&&r.request().method()==='POST',{timeout:55000});
    await page.getByLabel('Message DMS Copilot').fill(message);await page.getByRole('button',{name:'Send message',exact:true}).click();
    const result=await(await response).json();expect(result.mode).toBe('LIVE MODEL');
    expect(result.message).not.toBe('I can search fictional records and help prepare a draft for advisor review. I cannot purchase, delete, change prices, book appointments, reveal secrets or diagnose a fault. No data has changed.');
    return result;
  }
  let answer=await ask('Hello! What can you help me with?');expect(answer.provenance).toBe('AI GENERAL GUIDANCE');expect(answer.message).toMatch(/help|service|order|question/i);
  answer=await ask('What questions should I ask a customer who says engine spoil?');expect(answer.message).toMatch(/start|stall|noise|power|when/i);
  answer=await ask('How should I phrase that politely?');expect(answer.message).toMatch(/could|please|can|would|ask|tell/i);
  fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/live-copilot-conversation.png',fullPage:true});
  answer=await ask('Do we have oil filters?');expect(answer.cards.some((c:{id:string,detail:string})=>c.id==='FLT-001'&&c.detail.includes('4 pcs'))).toBeTruthy();
  answer=await ask('Why can’t you book appointments?');expect(answer.provenance).toBe('AI GENERAL GUIDANCE');expect(answer.message).toMatch(/advisor|human|confirm|book|schedule/i);
});
