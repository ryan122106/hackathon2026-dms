import {loadEnvConfig} from '@next/env';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
loadEnvConfig(process.cwd());
const key=process.env.MODEL_API_KEY?.trim();
if(!key)throw new Error('No local key configured for bundle check.');
function check(path:string):void {
  for(const entry of readdirSync(path,{withFileTypes:true})){
    const file=join(path,entry.name);
    if(entry.isDirectory())check(file);
    else if(/\.(?:js|json|css|map)$/.test(entry.name)&&readFileSync(file,'utf8').includes(key!))throw new Error('Credential detected in client assets.');
  }
}
check('.next/static');console.log('Client bundle credential check: PASS. No configured Meta key found in public client assets.');
