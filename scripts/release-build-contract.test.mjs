import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {releaseBuildContract,RELEASE_BUILD_STEPS} from './release-build-contract.mjs';
const current=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));
test('exact current executed five-stage build and aliases are required',()=>assert.equal(releaseBuildContract(current).ok,true));
test('every missing build stage is rejected, including knowledge generation',()=>{for(let n=0;n<RELEASE_BUILD_STEPS.length;n++){const p=structuredClone(current);p.scripts.build=RELEASE_BUILD_STEPS.filter((_,i)=>i!==n).join(' && ');assert.equal(releaseBuildContract(p).ok,false);}});
test('historical four-stage command, reordering and extra shell commands are rejected',()=>{for(const command of [RELEASE_BUILD_STEPS.slice(0,-1).join(' && '),[...RELEASE_BUILD_STEPS].reverse().join(' && '),current.scripts.build+' && true']){const p=structuredClone(current);p.scripts.build=command;assert.equal(releaseBuildContract(p).ok,false);}});
test('no-op substitutions for every required alias are rejected',()=>{for(const name of ['catalogue:apply','perf:images:apply','release:package','assistant:knowledge']){const p=structuredClone(current);p.scripts[name]='node -e "process.exit(0)"';assert.equal(releaseBuildContract(p).ok,false);}});
