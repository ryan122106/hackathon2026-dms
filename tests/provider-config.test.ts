import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modelJson} from '../lib/ai/model-client';
import {intentSchema} from '../lib/schemas';

test('custom provider uses pinned gateway, system role and standard Bearer authentication',async()=>{
  const names=['MODEL_PROVIDER','MODEL_API_KEY','MODEL_API_BASE_URL','MODEL_API_ALLOWED_ORIGIN','MODEL_ID','MODEL_ALLOW_INSECURE_HTTP'] as const;
  const previous=Object.fromEntries(names.map(n=>[n,process.env[n]]));const oldFetch=global.fetch;
  Object.assign(process.env,{MODEL_PROVIDER:'custom',MODEL_API_KEY:'test-gateway-key',MODEL_API_BASE_URL:'http://47.84.184.85:4000/v1',MODEL_API_ALLOWED_ORIGIN:'http://47.84.184.85:4000',MODEL_ID:'muse-1.3-gcr',MODEL_ALLOW_INSECURE_HTTP:'true'});
  let calls=0;
  global.fetch=async(url,init)=>{
    calls++;assert.equal(String(url),'http://47.84.184.85:4000/v1/chat/completions');
    assert.equal((init?.headers as Record<string,string>).Authorization,'Bearer test-gateway-key');
    const body=JSON.parse(String(init?.body));assert.equal(body.model,'muse-1.3-gcr');assert.equal(body.messages[0].role,'system');
    assert.equal(body.max_tokens,4096);assert.equal(body.max_completion_tokens,undefined);assert.equal(body.tools,undefined);
    assert.doesNotMatch(String(init?.body),/test-gateway-key/);assert.equal(init?.redirect,'error');
    return Response.json({choices:[{message:{content:'{"kind":"inventory.low_stock"}'}}]});
  };
  try{
    assert.equal((await modelJson('Only classify read intents',{},intentSchema)).kind,'inventory.low_stock');
    process.env.MODEL_ALLOW_INSECURE_HTTP='false';await assert.rejects(modelJson('Classify',{},intentSchema));assert.equal(calls,1);
    process.env.MODEL_ALLOW_INSECURE_HTTP='true';process.env.MODEL_API_ALLOWED_ORIGIN='http://untrusted.example';
    await assert.rejects(modelJson('Classify',{},intentSchema));assert.equal(calls,1);
  }finally{global.fetch=oldFetch;for(const name of names){if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}}
});
