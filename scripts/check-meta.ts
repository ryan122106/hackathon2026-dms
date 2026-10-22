import {loadEnvConfig} from '@next/env';
import {ModelError,modelJson,modelFallbackNotice} from '../lib/ai/model-client';
import {complaintPrompt,copilotPrompt} from '../lib/ai/prompts';
import {extractionSchema,extractionInput,liveDraft} from '../lib/ai/service-draft';
import {intentSchema} from '../lib/schemas';

// Loads local configuration without printing it. Sends only these fictional test inputs.
loadEnvConfig(process.cwd());
async function main(){
  const note='aircond not working, engine spoil';
  const extraction=await modelJson(complaintPrompt,{note:extractionInput(note),vehicle:{make:'Honda',model:'City'}},extractionSchema);
  const draft=liveDraft(note,'Honda',extraction);
  if(!draft.complaints.some(c=>/engine/i.test(c))||!draft.complaints.some(c=>/A\/C/i.test(c)))throw new Error('Coverage regression');
  console.log('Provider complaint extraction: LIVE MODEL. A/C and engine concerns both preserved; inspection tasks are application controlled.');
  const intent=await modelJson(copilotPrompt,{message:'Show low-stock parts',activePage:'/inventory'},intentSchema);
  if(intent.kind!=='inventory.low_stock')throw new Error('Unexpected read intent');
  console.log('Provider Copilot classification: LIVE MODEL. Correct allowlisted inventory intent.');
}
main().catch(error=>{console.error(modelFallbackNotice(error));if(error instanceof ModelError&&error.status)console.error(`HTTP ${error.status}; response format: ${error.responseFormat}. No upstream body or credentials displayed.`);process.exitCode=1;});
