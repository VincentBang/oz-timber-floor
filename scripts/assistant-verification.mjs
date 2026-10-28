import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
import {routing} from './october-route-fixture.mjs';
const commands=['node scripts/assistant-build-knowledge.mjs','npm run assistant:check','npm run assistant:eval','node scripts/assistant-holdout.mjs','npm run analytics:contract:check','npm run resend:enquiry:check','node --test scripts/catalogue-text.test.mjs','node scripts/catalogue-field-integrity.mjs','node scripts/ui-ux-lcp-check.mjs','node scripts/ui-qa.mjs','node scripts/seo-migration-hardening.mjs','git diff --check'];
const results=commands.map(command=>{const r=spawnSync('/bin/zsh',['-c',command],{encoding:'utf8',maxBuffer:10000000});console.log(command+' => '+r.status);return{command,exitCode:r.status,stdout:r.stdout,stderr:r.stderr};});
const out='docs/flooring-assistant/evidence/';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'COMMANDS.json',JSON.stringify(results,null,2));
const input=JSON.parse(fs.readFileSync('docs/flooring-assistant/PUBLIC_SAMPLES.json')),router=routing(process.cwd());for(const row of input){let file;if(['/sitemap.xml','/assets/contact-config.js'].includes(row.path))file=row.path.slice(1);else file=router.resolve(row.path).file;if(file&&fs.existsSync(file)){row.localCandidateSha256=hash(fs.readFileSync(file));row.matchesCandidateBytes=row.sha256===row.localCandidateSha256;}}
fs.writeFileSync('docs/flooring-assistant/PUBLIC_SAMPLES.json',JSON.stringify(input,null,2));
const corpus=JSON.parse(fs.readFileSync('assistant/generated/corpus.json')),again=spawnSync(process.execPath,['scripts/assistant-build-knowledge.mjs'],{encoding:'utf8'});if(again.status)throw Error('Recompile failed');const repeat=JSON.parse(fs.readFileSync('assistant/generated/corpus.json'));if(repeat.corpusVersion!==corpus.corpusVersion)throw Error('Nondeterministic corpus');
fs.writeFileSync(out+'DETERMINISM.json',JSON.stringify({success:true,corpusVersion:corpus.corpusVersion,candidateHash:corpus.candidateHash},null,2));
