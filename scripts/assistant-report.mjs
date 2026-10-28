import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from '../assistant/lib/security.mjs';
const root=process.cwd(),out=root+'/docs/flooring-assistant',evidence=out+'/evidence',read=name=>JSON.parse(fs.readFileSync(out+'/'+name));
const candidate=read('evidence/CANDIDATE.json'),source=read('SOURCE_MANIFEST.json'),evaluation=read('evidence/EVALUATION.json'),holdout=read('evidence/HOLDOUT.json'),browser=read('evidence/BROWSER.json'),performance=read('evidence/performance/SUMMARY.json'),check=read('evidence/CHECK.json'),commands=read('evidence/COMMANDS.json'),baseline=read('evidence/BASELINE_GUARDS.json'),publicSamples=read('PUBLIC_SAMPLES.json');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const sourcePaths=['.gitignore','OZ_STATUS.md','package.json','package-lock.json','assets/site.js','netlify/functions/flooring-assistant.mjs',...walk(root+'/assistant').map(f=>path.relative(root,f)),...fs.readdirSync(root+'/assets').filter(f=>f.startsWith('flooring-assistant')).map(f=>'assets/'+f),...fs.readdirSync(root+'/scripts').filter(f=>f.startsWith('assistant-')).map(f=>'scripts/'+f)];
const files=[...new Set(sourcePaths)].sort().map(file=>({file,sha256:hash(fs.readFileSync(root+'/'+file)),bytes:fs.statSync(root+'/'+file).size}));
const runtime=files.filter(f=>/^(?:assets\/|assistant\/(?:lib|generated|config)\/|netlify\/)/.test(f.file));for(const f of runtime)assert.equal(f.sha256,hash(fs.readFileSync(candidate.fixture+'/'+f.file)),'Candidate runtime drift '+f.file);
const currentHardening=JSON.parse(fs.readFileSync(root+'/docs/release/OZ-RELEASE-CLOSEOUT/generated/migration/seo-migration-hardening-report.json'));assert.deepEqual(currentHardening.blockers,baseline.hardening.blockers,'Hardening differs from entry');
const staticSecretFindings=[],supplierFindings=[],generatedLeakFindings=[];
const catalogue=JSON.parse(fs.readFileSync('data/product-catalogue.json')),privateNames=[...new Set([...catalogue.products,...catalogue.ranges].map(r=>r.supplier).filter(s=>typeof s==='string'&&s.length>3&&!/approved catalogue|oz timber/i.test(s)))];
for(const f of candidate.package.staticFiles){if(!/\.(html?|js|mjs|cjs|json|map|css|txt|xml|csv|md|toml)$/i.test(f.path))continue;const value=fs.readFileSync(candidate.fixture+'/dist/'+f.path,'utf8');if(/\bsk-[A-Za-z0-9_-]{24,}|\bre_[A-Za-z0-9]{24,}|BEGIN (?:RSA |EC )?PRIVATE KEY/.test(value))staticSecretFindings.push(f.path);if(/PRIVATE_PROVENANCE|ENTRY_STATE|DISPOSITION_LEDGER|FIELD_CONFLICTS|supplierSourceUrl|sourceTag/.test(value))generatedLeakFindings.push(f.path);const names=privateNames.filter(n=>value.toLowerCase().includes(n.toLowerCase()));if(names.length)supplierFindings.push({file:f.path,names,inherited:!f.path.includes('flooring-assistant')});}
const assistantPrivateLeaks=supplierFindings.filter(f=>!f.inherited);
const scans={staticTextExtensions:'html,js,mjs,cjs,json,map,css,txt,xml,csv,md,toml',staticSecretFindings,generatedLeakFindings,assistantPrivateLeaks,inheritedSupplierOccurrences:supplierFindings};fs.writeFileSync(evidence+'/ARTIFACT_SCAN.json',JSON.stringify(scans,null,2));assert.equal(staticSecretFindings.length,0);assert.equal(assistantPrivateLeaks.length,0);assert.equal(generatedLeakFindings.length,0);
const core={schemaVersion:1,at:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD']).toString().trim(),branch:execFileSync('git',['branch','--show-current']).toString().trim(),trackedPatchHash:hash(execFileSync('git',['diff','--binary'])),sourceFilesHash:hash(files),files,runtimeMatchesBuild:true,inheritedMobileHeaderChanges:true,staticManifestHash:candidate.package.staticManifestHash,staticFileCount:candidate.package.staticFileCount,staticDirectory:candidate.fixture+'/dist',functions:candidate.package.functions,functionBundleDirectory:candidate.package.bundleDirectory,knowledgeSourceHash:source.candidateHash,corpusVersion:candidate.package.corpusVersion,corpusSha256:candidate.package.corpusSha256,promptVersion:'oz-fact-plan-1',model:'mock-fact-selector-v1',reviewedLiveModel:null,paidMode:false,sourceUiDefault:false,previewArtifactUi:true,hostedPreview:'NOT_RUN',production:'UNCHANGED',checks:{unitTests:20,evaluation:evaluation.summary,additionalHoldout:holdout.passed,browserChecks:browser.checks.filter(c=>c.pass).length,browserSuccess:browser.success,axeStates:browser.axeStates,axeViolations:browser.violations.length,performance,package:candidate.routes,oldHardeningBlockers:currentHardening.blockers.length},dependencies:{buildOnly:{parse5:'8.0.0'},server:'Node24 built-ins only',browser:'none',netlifyBundler:'16.5.1',lighthouse:'13.5.0'}};
core.manifestSha256=hash(core);fs.writeFileSync(out+'/RELEASE_MANIFEST.json',JSON.stringify(core,null,2));
const unitRow=commands.find(c=>c.command==='npm run assistant:check');assert(unitRow.stdout.includes('tests 20'),'Unit command log is not current');
const legacyFailure=commands.find(c=>c.command==='node scripts/ui-qa.mjs'),oldUI=JSON.parse(baseline.results[0].stderr),newUI=JSON.parse(legacyFailure.stderr);
const initials=read('ENTRY_STATE.json');
const missing=Object.fromEntries(['boardSize','packSizeM2','warrantySummary','waterResistance','commercialSuitability','specSheetUrl'].map(f=>{const eligible=new Set(JSON.parse(fs.readFileSync('assistant/generated/corpus.json')).documents.filter(d=>d.entityType==='product').map(d=>d.canonicalPath));return[f,catalogue.products.filter(p=>eligible.has(p.url||p.slug)&&!String(p[f]||'').trim()).length];}));
const rows=publicSamples.map(s=>'| `'+s.path+'` | '+s.status+' | '+(s.matchesCandidateBytes?'same':'candidate differs')+' |').join('\n');
const report=`# Oz site-grounded Flooring Assistant — local candidate

27 October 2026, Australia/Sydney. **LOCAL HOLD — functional mock implementation and automated feature checks complete; performance/legacy-guard and independent acceptance remain pending. HOSTED PREVIEW NOT RUN / HOLD.** No commit/push/merge/deployment, DNS/provider/production change, real enquiry or remote AI call occurred. Source UI and API remain default-off; a separately sealed local/mock preview artifact is prepared, not published. No live model/rates/store are approved or connected.

## What works

Vanilla lazy panel with native modal/focus/Escape, safe source links, mobile/dock/menu/consent priority, visible-viewport keyboard adaptation, clear, feedback and user-reviewed enquiry drafts. First-use disclosure precedes Send. Local responses use deterministic retrieval plus a mock fact selector. The server renders exact eligible facts and qualifiers; it does not accept arbitrary model prose, URLs, specifications or actions. OpenAI Responses adapter exists, bounded and mock-tested, but is deliberately disconnected from public paid access.

Drafts: six existing enquiry types; public product/range/category context only in existing URL parameters; no notes/contact details in URL; opaque fragment; one-use tab storage with15-minute TTL; contact-page preview/edit; fill-empty-only apply; attribution/typed fields and required consent preserved. No form submission or lead-conversion event is caused by handoff. Normal site/form remains available with JS/assistant off. Full transcript stays in memory and is not sent to the form/provider/history store.

## Preserved and changed

Branch **${core.branch}**, HEAD **${core.head}** unchanged. All HTML, catalogue data, routing, sitemap, robots, legal content, contact/GA4 config and existing Resend function remain byte-identical to task entry. Existing unpublished fourteen-HTML/mobile/header/CSS changes and untracked evidence are inherited candidate content, not assistant work or authority to publish. Shared site.js is unchanged outside the marked Flooring assistant bridge. No test expectations or historical baselines were reset.

Assistant source/tooling files (${files.length}; exact hashes in RELEASE_MANIFEST.json):

${files.map(f=>'- `'+f.file+'`').join('\n')}

Private generated inventories/provenance/evaluation/screenshots are excluded from dist and ignored for accidental public Git inclusion. Canonical URLs, H1/title/meta/robots/schema/internal hrefs and all 1,403 catalogue/utility noindex routes are unchanged from entry. The public API response alone has no-store/noindex; no production global indexing change.

## Knowledge coverage and authority

| Inventory unit | Actual count / treatment |
| --- | --- |
| Publication owners | ${source.counts.publication}, resolved through actual routing |
| Eligible candidate documents | ${source.counts.documents}: 639 product details,78 range details,55 other public pages |
| Restricted publication identity | 1 range containing unreviewed water-resistance wording; not recommended |
| Nonowner/held physical HTML | ${source.counts.dispositions.excluded}, excluded individually |
| Redirect rule entries | ${source.counts.dispositions.alias_only}, alias-only, not specification evidence |
| Retirement registry | Artisan Oak410, never recommended; Artisan Tile is distinct |
| Matched structured product records | 695 across639 canonical product routes |
| Duplicate-route groups | 56; no last-record-wins merge |
| Quarantined field conflict units | ${source.counts.conflicts}, product/range field disagreements |
| Missing/risky suppressed units | ${source.counts.gaps}, not distinct products |
| Eligible candidate facts / chunks | ${source.counts.facts} / ${source.counts.chunks} |

DISPOSITION_LEDGER.json is per owner/file/rule, so these units must not be summed as unique URLs. SOURCE_MANIFEST.json binds exact inputs; PRIVATE_PROVENANCE.json retains record IDs only privately; FIELD_CONFLICTS.json and FIELD_GAPS.json show every suppression. Raw missing-field denominator695 records (duplicates included): ${Object.entries(missing).map(([k,v])=>k+'='+v).join(', ')}. Unknown values are not false/true ratings. Duplicate name/install/use differences are recorded; corroborated identity/category/thickness/dimensions can still be answered. Avala Blackbutt retains both183/230 widths; De Marque Copper Brown remains engineered15mm. No exact-equivalence claim is made for historical family fallbacks.

Native disclosed content is parsed without trusting UI repetition, hidden/script/template nodes or instruction-like text. Risky safety/warranty/water/acoustic/technical claims are suppressed even if published. Business constants cross-check contact source. Planning examples never become completed work. Sparse FAQ/spec units remain intact, though shorter than the nominal250–600-token narrative target. No source update timestamp is misrepresented as product freshness. Corpus is candidate-only, with no fabricated owner review dates. Every content release rebuilds/binds it; no runtime crawling, uploads, embeddings, vector service or automatic learning exists.

Fresh direct HTTPS samples (read-only, no WordPress cache inference):

| Route | HTTP | Local byte comparison |
| --- | ---: | --- |
${rows}

These eleven samples do not establish a fresh all-page production crawl, deployed function correctness or live delivery. Local candidate differences are explicit; corpus does not silently mix production/candidate source versions.

## Evaluation and security

- Gold120:30exact entities,20category/comparison,20service/preparation,15business/policy/FAQ/projects,15ambiguity/unknown/retirement,20adversarial/privacy. **${evaluation.summary.passed}/120 passed**. Route recall@8 **63/63** reviewed answerable route-labelled cases; zero wrong-entity accepted on30exact route cases. All finite source-route assertions valid. Main answers:71 supported,16 clarification,33 confirmation; correct targeted next steps count as resolution, not invented facts. Prohibited critical claims and unsupported output fields are rejected.
- Additional24unseen-phrasing cases: **${holdout.passed}/24**. The initial labelled24subset was inspected during iteration and is not claimed as an untouched holdout; the additional set was not used for retrieval tuning. Initial failures and mechanical P&H expected-path correction are preserved. No live-model evaluation or independent human citation-entailment audit was performed; the95%human-supportedness activation gate remains pending. Finite assertions are not universal hallucination/safety guarantees.
- **20 unit groups pass**: bounded/malformed/prototype/role/origin requests; signed token tamper/expiry; default/alias gates; trusted provider-context production/published/wrong-project/guest refusal; shared mock atomic counters/concurrency/spend/idempotency/crash handling; fail-closed store; one Responses call/refusal/truncation/429-like failures/timeouts; valid-but-irrelevant and fake source IDs; invented output claims; stale corpus; PII/log redaction; all six handoff types/TTL/storage failures; hidden-source injection.
- Budget store is expressly an in-memory atomic simulation for local testing, **not durable hosted enforcement**. Paid path refuses it; missing approved model/rates/store closes paid mode. Provider dashboard alerts are not a cap. No paid retry loop or tool/network fetch other than the fixed future Responses adapter exists. History is validated but never an evidence authority or assistant/system instruction.
- Three actual analytics-bridge browser states pass with an inert gtag collector and production-origin GETs intercepted to loopback:accepted emits only allowed enums; rejected/unset emit nothing; extra PII and quote_submit aliases rejected. Real analytics sent:0.
- Whole static text/generated-map scan:0 secret findings,0 assistant-private-name findings,0 private inventory leaks. Inherited full supplier-name text occurrences: ${supplierFindings.length} files, listed privately and not ingested as assistant identity facts. Existing supplier-derived asset filenames are not copied into assistant responses. Server/model corpus scan passes; private provenance never goes to model/browser. Bundles contain only two intended functions and no helper endpoints.

## Browser and performance

**${browser.checks.filter(c=>c.pass).length}/${browser.checks.length} checks PASS**,36 main route/viewport cells (home/product/range/service/guide/contact ×320/360/390/768/1024/1440,844px high),18additional all-three-consent states at390px, six contact draft journeys, network/storage/landscape/no-JS and keyboard-sized390×380. Zero uncaught JS errors, detected overflow, broken changed controls or automated axe violations across36modal states. Keyboard geometry is asserted after bounded viewport event settling; not an actual iPhone/Android keyboard test. Initial focus/priority/style/resize failures were corrected; old evidence was not relabelled.

[Screenshot gallery](evidence/SCREENSHOTS.html). Native modal focus/return, menu/consent precedence, safe source links, privacy/contact, error/retry and one-use draft behaviour verified locally. Physical Safari/Android, VoiceOver/TalkBack, actual browser zoom and a genuine device keyboard remain manual gaps; device-scale/reflow or viewport shrink is not certification. No real email-delivery or live-GA4 receipt claim.

Incremental enabled bootstrap assets (gzip incl bridge): **${check.incrementalInitialGzip} bytes**, under30KB. Launcher/config now wait for page load/idle; panel/style/handoff load on interaction. No browser/model SDK or new fonts. Matched final three-run Lighthouse13.5 mobile390×844 DPR1, simulated mobile throttle, third-party fonts/GA4 blocked: median performance **${performance.before.performance}→${performance.after.performance}**, LCP **${(performance.before.lcp/1000).toFixed(3)}s→${(performance.after.lcp/1000).toFixed(3)}s** (${performance.lcpDeltaMs.toFixed(1)}ms), CLS0→0;100ms regression budget **${performance.within100ms?'met':'NOT MET'}**. An earlier144ms regression prompted moving bootstrap off the load path. Final113ms remains about13ms beyond the target, within noisy lab variation but not declared passing; no repeat-until-green claim. Raw runs/earlier iteration retained; this does not solve the existing2.5s LCP goal or establish field CWV. Do not claim a speed uplift from the assistant.

## Isolated package and exact identities

Protected static directory: \`${core.staticDirectory}\`.
Static files **${core.staticFileCount}**, authoritative final static manifest SHA-256 **${core.staticManifestHash}**. This is after the one explicit generated preview-UI flag override; the earlier build-tool manifest refers to the source-off flag and must not be used as the final preview identity.

Function bundle directory: \`${core.functionBundleDirectory}\`.
${core.functions.map(f=>'- `'+f.name+'`: **'+f.sha256+'** (`'+f.path+'`)').join('\n')}

Knowledge source hash **${core.knowledgeSourceHash}**; corpus version **${core.corpusVersion}**; corpus bytes **${core.corpusSha256}**; promptoz-fact-plan-1; mock selector only; reviewed live modelnull. Candidate source fingerprint **${core.sourceFilesHash}**; tracked patch identity **${core.trackedPatchHash}**. Sealed release manifest SHA-256 **${core.manifestSha256}** (hash of manifest before its own checksum property).

Zero build source mutations; active runtime bytes match the isolated fixture. Static package excludes data/docs/assistant private roots. Corpus/private server libraries are statically bundled, not copied to assets. Extracted function loads and answers Avala locally without the original checkout; Node24 compatibility and API-v2 route/rate configuration are present. Existing Resend source remains unchanged. Package routing:773canonical sitemap200owners,539legacy outcomes (18direct200/507redirect→200/14410),2,226HTML including Google verification,11,249link targets,2,273asset targets,1,485schema blocks. Private/public checks are local; hosted context/rate/auth semantics are NOT verified.

## Commands actually run and remaining failures

${commands.map(c=>'- `'+c.command+'` — exit'+c.exitCode).join('\n')}
- \`OZ_PLAYWRIGHT_MODULE=<local Playwright> OZ_AXE_PATH=<local axe> node scripts/assistant-browser.mjs\` — PASS.
- \`OZ_PLAYWRIGHT_MODULE=<local Playwright> node scripts/assistant-analytics-browser.mjs\` — PASS.
- \`OZ_LIGHTHOUSE_CLI=<local Lighthouse> node scripts/assistant-performance.mjs\` — six valid matched runs.
- \`OZ_ASSISTANT_BUNDLER=<Netlify bundler16.5.1> npm run assistant:build:isolated\` — PASS; includes npmci, protectedbuild, postrenderknowledge, functionpackaging/clean-load and October26packagevalidator. Exact commands/logs/paths are in evidence/CANDIDATE.json.
- \`node scripts/assistant-baseline-checks.mjs\` — reproduces entry-state guards in a separate temporary copy; no source/baseline reset.

Legacy UI gate remains FAIL: entry had${oldUI.failures.length}stale browser-report hashes; current has${newUI.failures.length}findings, adding the deliberate pinned build-only parse5 dependency against its blanket zero-dependency expectation. This is a **new, explicitly documented guard-policy conflict**, not falsely labelled pre-existing. No runtime dependency is added; fresh tests/package/audit pass, but that legacy gate has not been approved/changed.

SEO hardening remains FAIL with the **same10blockers reproduced at entry**, byte-equal blocker objects: prior Stone Floor redirect/equity expectations versus current treatments and oak owner rewrite-rule reporting. No protected routing decision was reopened to make this feature pass. No overall migration/production GO is claimed.

## Owner gates and next narrow action

Cost/provider/atomic-store specification,14-day metadata proposal, alerts/kill switches/rollback and exact future deployment commands are in [RUNBOOK.md](RUNBOOK.md). [PRIVACY_DRAFT.md](PRIVACY_DRAFT.md) is proposed text only; neither legal owner was changed. Rates/account/model unavailable: no dollar forecast invented; four turns/conversation,3,000input/600output percall assumptions yield400/4,000/40,000calls for100/1,000/10,000conversations. Cost formula uses operator-approved per-million rates; USD5/day,25/month and1,000calls/month remain proposals, not purchases/settings. Managed atomic Redis-compatible adapter/provider/region/cost approval and implementation are required before any paid mode.

Outstanding: owner source/conflict/privacy review; independent95%citation-entailment evaluation; real model availability/quality/rates; real atomic store; physical devices/assistive tech; legacy dependency guard policy; hosted team-login/context/origin/rate/cost/failure tests. Source/UI/API production gates stay off. Rollback keeps the monotonic retirement denylist and does not republish unrelated mobile/header work.

Local preview: **http://127.0.0.1:8840/** (mock only; real form POSTs denied). Use Ask about flooring. Source UI default remains off on other normal servers. Single next approval request: approve deployment of **this exact sealed protected MOCK preview**, including inherited candidate work and nonproduction-only origin/session/enable settings. No API key, paid call, production publication, DNS or production analytics change is included. If platform context/permissions prevent a protected mock, leave it disabled and report the exact limitation.
`;
fs.writeFileSync(out+'/REPORT.md',report);
const images=fs.readdirSync(evidence+'/screenshots').filter(f=>f.endsWith('.png'));
fs.writeFileSync(evidence+'/SCREENSHOTS.html','<!doctype html><html><head><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width"><title>Local flooring assistant QA</title><style>body{font:16px system-ui;margin:24px;background:#f5f5f3}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}img{width:100%;height:560px;object-fit:contain;object-position:top;background:white}figcaption{overflow-wrap:anywhere}</style></head><body><h1>Local/mock assistant screenshots</h1><p>Private evidence. No hosted deployment.</p><main>'+images.map(f=>'<figure><a href="screenshots/'+f+'"><img loading="lazy" src="screenshots/'+f+'" alt="'+f+'"></a><figcaption>'+f+'</figcaption></figure>').join('')+'</main></body></html>');
console.log(JSON.stringify({report:out+'/REPORT.md',manifestSha256:core.manifestSha256,files:files.length,scans:{secrets:0,newPrivateNames:0,inheritedSupplierFiles:supplierFindings.length},staticManifest:core.staticManifestHash,functionBundleDirectory:core.functionBundleDirectory},null,2));
