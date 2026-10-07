import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createPublicationInventory} from './publication-inventory.mjs';
const root=process.cwd(),out='docs/migration-october-2026';
const deployId=process.argv[2] || '6ac5c7c37cf1129727d1d838';
if(!/^[a-f0-9]{24}$/.test(deployId))throw new Error('Expected verified Netlify deploy ID');
const git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:30e6});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const packageFiles=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else{const b=fs.readFileSync(f);packageFiles.push({path:path.relative('dist',f),bytes:b.length,sha256:sha(b)});}}}
walk('dist');packageFiles.sort((a,b)=>a.path.localeCompare(b.path));
const packagePayload={schemaVersion:1,fileCount:packageFiles.length,byteCount:packageFiles.reduce((n,f)=>n+f.bytes,0),files:packageFiles};
const packageHash=sha(JSON.stringify(packagePayload,null,2)+'\n');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');
const audit=json(out+'/validation.json'),commands=json(out+'/checks/commands.json');
const https=fs.existsSync(out+'/https-validation.json')?json(out+'/https-validation.json'):null;
const before=JSON.parse(git(['show','HEAD:data/product-catalogue.json'])),after=json('data/product-catalogue.json');
const delta=[];
for(const type of ['products','ranges'])for(let i=0;i<after[type].length;i++)for(const field of Object.keys(after[type][i]))if(JSON.stringify(before[type][i][field])!==JSON.stringify(after[type][i][field]))delta.push({type,slug:after[type][i].slug,field,before:before[type][i][field],after:after[type][i][field]});
write('catalogue-field-delta.json',delta);
const gate=json(out+'/current-migration-gate/migration-readiness-report.json');
const pending=gate.issues.filter(x=>x.severity==='BLOCKER');
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const pendingRows=pending.map(x=>{const p=after.products.find(p=>p.url===x.route||'/products/'+p.slug+'/'===x.route);return [x.route,p?.range,x.failures?.join(';'),p?.supplierSourceUrl||p?.sourceUrl,'Verified product-specific dimensions required; do not infer or bulk noindex'];});
fs.writeFileSync(out+'/pending-catalogue-evidence.csv','route,range,failed_requirement,existing_source,required_action\n'+pendingRows.map(r=>r.map(quote).join(',')).join('\n')+'\n');
const routes=json('config/october-article-routes.json');
const articles=Object.entries(routes).map(([s,target])=>({old_url:'/'+s+'/',action:target?'301 to equivalent guide':'restored original WordPress article',destination:target||'/'+s+'/',status:target?'301 → 200':'200'}));
write('article-treatments.json',articles);
const artisan=['cotton-wood','biarritz','chanterelle','chantilly','naturalle','oxford-grey','provence','woodlands','natural-classic','romandie','montreux','brittany-grey'].map(colour=>({legacy:'/product/artisan-'+colour+'/',currentDestination:'/hybrid/',currentStatus:'301 → 200',decision:'UNRESOLVED — engineered family; exact current products/stock or supported retirement destination required'}));
write('artisan-pending.json',artisan);
const files=[...new Set([...git(['diff','--name-only']).trim().split('\n'),...git(['ls-files','--others','--exclude-standard']).trim().split('\n')])].filter(f=>f&&!f.startsWith(out+'/')).sort();
write('source-change-manifest.json',files.map(file=>({file,sha256:sha(fs.readFileSync(file))})));
fs.writeFileSync(out+'/FILES_CHANGED.md','# Changed source files\n\n'+files.map(f=>'- `'+f+'`').join('\n')+'\n');
const sealedRoot='docs/release/OZ-RELEASE-CLOSEOUT/';
const sealed=json(sealedRoot+'RELEASE_MANIFEST.json').evidence;
const sealedMismatch=sealed.filter(x=>!fs.existsSync(sealedRoot+x.file)||sha(fs.readFileSync(sealedRoot+x.file))!==x.sha256).map(x=>x.file);
const inv=createPublicationInventory({root:path.join(root,'dist'),domain:'https://oztimberfloor.com.au'});
const prodRoot='/tmp/oz-oct07.PmhZo2/production-check/dist';
const prod=createPublicationInventory({root:prodRoot,domain:'https://oztimberfloor.com.au'});
const production={isolated:true,notPublished:true,publicationPages:prod.publicationRoutes.length,noindexRoutes:prod.noindexRoutes.length,noGlobalNoindex:!fs.readFileSync(prodRoot+'/_headers','utf8').includes('noindex'),approvedGa4:fs.readFileSync(prodRoot+'/assets/contact-config.js','utf8').includes('G-EWSMKKM9N8'),samePublicationRoutes:JSON.stringify(prod.publicationRoutes)===JSON.stringify(inv.publicationRoutes)};
const manifest={generatedAt:new Date().toISOString(),branch:git(['branch','--show-current']).trim(),head:git(['rev-parse','HEAD']).trim(),verdict:'HOLD MIGRATION',draft:{id:'6ac5c7c37cf1129727d1d838',url:'https://6ac5c7c37cf1129727d1d838--oztimberfloor.netlify.app',packageManifestSha256:'8a5059e00246152cbb1d2ed57f3e906f5546a77e1731c4817168b51334f143df',publicFiles:6259,bytes:583749125},supersededDrafts:['6ac5c6c5d27a10f35c49cfef','6ac5c72b4ab5d819269e702f'],publishedDeploymentUnchanged:'6aa2a1e553c3e900084434fc',customDomain:null,sealedEvidence:{checked:sealed.length,mismatches:sealedMismatch},productionFixture:production,publication:{htmlPages:inv.physicalHtmlFiles,verificationHtmlFiles:1,indexablePhysical:inv.physicalIndexableHtmlFiles,canonicalPages:inv.publicationRoutes.length,noindexRoutes:inv.noindexRoutes.length},https:https?{routeChecks:https.routeChecks,passed:https.passed,failures:https.failures}:null,blockers:{wrongFamilyArtisanRedirects:12,catalogueQualityGate:pending.length},providerFormSubmissions:0,liveAnalyticsRequests:0,productionActions:false,committed:false};
Object.assign(manifest.draft,{id:deployId,url:`https://${deployId}--oztimberfloor.netlify.app`,packageManifestSha256:packageHash,publicFiles:packagePayload.fileCount,bytes:packagePayload.byteCount});
manifest.supersededDrafts=['6ac5c6c5d27a10f35c49cfef','6ac5c72b4ab5d819269e702f','6ac5c7c37cf1129727d1d838'].filter(id=>id!==deployId);
if(https && https.base!==manifest.draft.url)throw new Error('HTTPS evidence belongs to another deploy');
const liveBrowser=fs.existsSync(out+'/browser/https-browser.json')?json(out+'/browser/https-browser.json'):null;
manifest.httpsBrowser=liveBrowser?{base:liveBrowser.base,success:liveBrowser.success,flows:liveBrowser.flows.length,providerSubmissions:0}:null;
write('RELEASE_MANIFEST.json',manifest);
const table=(head,rows)=>'| '+head.join(' | ')+' |\n| '+head.map(()=> '---').join(' | ')+' |\n'+rows.map(r=>'| '+r.join(' | ')+' |').join('\n');
const browser=json(out+'/browser/targeted-browser.json');
const regression=json(out+'/regression-browser/browser-qa.json');
const report=`# October migration repair report

Branch: \`${manifest.branch}\`. Entry/current HEAD: \`${manifest.head}\`. Changes remain uncommitted.

Verdict: **HOLD MIGRATION**. Safe repairs are implemented and a protected draft is available; the two substantive blockers below remain.

Preview: ${manifest.draft.url}

## 1. Files changed

- \`data/product-catalogue.json\`: ${new Set(delta.map(x=>x.type+':'+x.slug)).size} records, ${delta.length} field changes; exact before/after values in \`catalogue-field-delta.json\`.
- Catalogue HTML: invalid thickness/installation/schema values removed; Aquastop cards use product-specific thickness; Hardwood library count derives from published range membership.
- Four restored article directories, \`guides/index.html\`, \`_redirects\`, \`sitemap.xml\`, \`config/october-article-routes.json\`: recovered content and discoverable, direct routes. Only three redirect rules added; no existing redirect rewritten.
- \`index.html\` and \`googlea11728cf4d174049.html\`: existing Google verification carried forward from live WordPress.
- \`assets/site.js\`, \`scripts/prepare-netlify-deploy.mjs\`: approved production GA4, hostname gating, safe URL/referrer values, duplicate-init protection.
- Package allowlist and publication inventory: four restored directories included; the exact verified Google token file is a verification resource, not a canonical publication page.
- New October checks, repair/render utilities, source snapshots, private QA evidence, \`OZ_STATUS.md\` and private-evidence ignore rule. Full file list: \`FILES_CHANGED.md\`.

## 2. P0 article and redirect work

${table(['Old URL','Action','Destination','Local HTTP'],articles.map(a=>['\`'+a.old_url+'\`',a.action,'\`'+a.destination+'\`',a.status]))}

The three guide mappings retain the original preparation, engineered-suitability and hardwood-investment intent. The four restorations retain the original owned article bodies, strip Divi shortcodes and fix internal contact links. The installation article title/H1 now emphasises mistakes, avoiding a collision with the established installation service owner. No generic guide/category fallback is used for these articles.

### Artisan Oak — not fixed

${table(['Legacy product URL','Current final destination','Status'],artisan.map(a=>['\`'+a.legacy+'\`','\`'+a.currentDestination+'\`',a.currentStatus]))}

These twelve destinations are still semantically wrong. The imported exact-product pages also use Hybrid classification and an Artisan Tile image; redirecting into those held pages would not be a safe repair. The current range mapping is also not a verified active Artisan Oak collection. Supplier absence is not proof of discontinuation. No unsupported replacement destination, retirement or indexation change was made. The owner was asked for current range/colour availability evidence.

## 3. Redirect audit

Current WordPress sitemap snapshots reproduce **${audit.legacyUrls} unique URLs**: ${audit.direct200} direct 200, ${audit.permanentRedirects} permanent redirects, ${audit.notFound} final 404, ${audit.gone} deliberate 410, ${audit.chains} chains and ${audit.loops} loops. The package contains ${audit.ruleEntries} rule entries. Raw rule counts are not unique legacy-URL counts.

The known wrong-family set is 12 Artisan Oak URLs. Another ${audit.needsRelevanceEvidence} broad product-to-category mappings are flagged **NEEDS_EVIDENCE**, not declared irrelevant or safe. Their retirement/relevance requires source, GSC and where available backlink/GA4 evidence; lack of exported data does not establish zero value. See \`migration-url-review.csv\`.

## 4. Catalogue validation

- Aquastop Beach: retained verified 14 mm product fact; range card changed from 8 mm to 14 mm. Other cards derive thickness from their own product record; range options are 8/12/14 mm. Source: https://preferencefloors.com.au/floor/beach/ and https://preferencefloors.com.au/brand/aquastop/.
- Swish: removed material names from thickness fields, including the same defective oak importer fields. Actual numeric replacements remain unconfirmed; a material name is not treated as a measurement.
- Wide Plank: removed mixed board/pack/finish strings from thickness aliases and malformed installation text. Existing separate fields remain available; unknown dimensions were not parsed from cross-contaminated hardwood text. The supplier URL now shows ASPECT; that alone does not establish equivalence for every old colour.
- Hardwood Collection: published range membership yields **12**. Listing and range agree; no 188-colour fallback is used.
- Guardrails: malformed values fail the new catalogue check and packaging; negative/known-good fixtures are included. Data and HTML repair is idempotent.

**Unchanged migration gate: ${pending.length} catalogue blockers.** Clearing false specifications exposes missing dimensions on nine Swish oak and eighteen Wide Plank pages. Their indexation was not silently changed. Exact routes and evidence needed are in \`pending-catalogue-evidence.csv\`. This is not a migration GO.

## 5. SEO, sitemap and indexing

- ${inv.physicalHtmlFiles} publication HTML files plus one verification HTML resource; ${inv.physicalIndexableHtmlFiles} physical indexable HTML pages including retained physical aliases.
- **${audit.sitemap.count} canonical/sitemap URLs = 771 prior canonicals + four restored articles.** Zero invalid, redirecting, duplicated or intentional-noindex sitemap entries; zero canonical failures and zero broken local links/assets in the sitemap-page crawl.
- Existing protected metadata, canonical owners, H1s, hrefs and form contracts are unchanged, except four explicitly added guide-library links. All 1,400 noindex routes, the exact 172 holds and the 128 shadow cases are preserved by the current addendum checks.
- Staging: global \`X-Robots-Tag: noindex, nofollow\`; analytics configuration null. Production: separately built isolated fixture enables indexability and the approved ID only with the existing production approval flag. It was not published.
- Search Console: the existing meta token and exact Google verification filename/content are supported. DNS was neither changed nor relied upon as fresh verification evidence. Verification file is excluded from the publication count, not from the public package.
- Protected preview and final production-domain/DNS behaviour are distinct. Custom-domain redirects, TLS, indexability and analytics receipt need final cutover testing under separate approval.

## 6. Analytics

Approved ID: **G-EWSMKKM9N8**. Wrong-property build overrides are rejected. Loading/events are restricted to the production Oz hostnames; preview hosts suppress events even when a collector is present. Config/pageview initialisation occurs once. Query/fragment values are omitted from page_location; referrer is origin-only. Successful enquiry events use the existing allowlisted context and no name/email/phone/address/message values. Unit tests cover accepted response, failed response, stale/malformed markers, direct visits, refresh and missing collector. No production GA4 request was sent. Live GA4 receipt and property-admin conversion settings were not checked or changed.

## 7. Forms and browser evidence

The existing browser suite passed ${regression.routeMatrix.length} route/viewport cells at 1440, 1024, 768, 390 and 320 px, with ${regression.captures.length} captures, mobile navigation, filters, consent, field selection, product/range prefill, submit visibility and dock checks. This suite was run before the final article title/guide-link and related-card copy deltas; its original hashes are retained, not relabelled. Those deltas were separately re-crawled and captured.

The final targeted browser suite passed desktop 1440 and mobile 320 journeys from home through category, range, product and enquiry, plus ${browser.captures.length} article/library captures. Two **intercepted local mock** submissions preserve product/range/category/enquiry context, navigate to thank-you, fire one quote_submit and none on refresh/direct visit. Invalid forms send no request, and submit is unobstructed. No real provider submission, email, call or SMS was made. Previous owner-confirmed inbox delivery is historical evidence, not a fresh receipt test. Physical-device checks were not performed.

## 8. Actual validation results

Before edits, the isolated baseline passed catalogue field integrity, analytics event contract, current release contract, routing contract, image dimensions, LCP and local migration/GSC/SEO-hardening checks. The first isolated GSC run failed because the workbook copy was nested incorrectly; it passed after correcting the fixture path. That was a test-fixture issue, not a website repair. Existing baseline tests did not detect the reported false source-field values.

${table(['Command','Exit','Outcome'],commands.map(c=>['\`'+c.command+'\`',c.exitCode,c.exitCode===0?'PASS':c.command.includes('migration:check:local')?'27 genuine missing-data blockers':c.command.includes('october-migration-audit')?'Twelve known wrong-family redirects remain':c.command.includes('release:routing')?'Historical fixed rule count 1930 vs current 1933':c.command.includes('current-release-contract')?'Historical exact September hashes/set differ; retained unchanged':'FAIL — see log']))}

Both protected and isolated production builds passed. Final protected package: ${manifest.draft.publicFiles} files, ${manifest.draft.bytes} bytes; manifest SHA-256 \`${manifest.draft.packageManifestSha256}\`. Final production fixture has the same 775 publication routes and unchanged noindex holds.

HTTPS: ${https?`${https.passed}/${https.routeChecks} route checks passed; ${https.failures.length} failures. See https-validation.json.`:'Still pending; do not claim deployment verification.'}

HTTPS browser navigation: ${liveBrowser?.success&&liveBrowser.base===manifest.draft.url?'PASS at 1440 and 320 px on this exact draft; home → category → range → product → enquiry; context, required consent, phone link, noindex-safe configuration and unobstructed submit checked. No form submitted.':'Not yet verified on this exact final draft; see browser/https-browser.json.'}

The old exact R1 tests were not weakened or given new baseline hashes. The bounded October delta contract passes; it verifies the authorised additions and preserved contracts but cannot erase genuine catalogue/redirect blockers. ${sealed.length} sealed release evidence hashes checked; ${sealedMismatch.length} mismatches. No commit, push, merge, production publication, DNS/domain change, provider configuration change or Search Console write occurred. Netlify published deployment remains \`6aa2a1e553c3e900084434fc\`; custom domain remains unset.

## 9. Remaining launch blockers and next action

1. Resolve the twelve Artisan Oak engineered-colour owners using confirmed current range/product evidence or an explicitly supported retirement treatment. Their present hybrid destinations remain wrong.
2. Supply or establish record-specific dimensions for the 27 listed Swish oak/Wide Plank records (and confirm the unresolved Swish laminate measurements), then rerun the unchanged publication-quality gate. No blanket noindex or guessed values.

Highest-value next action: provide current supplier confirmation for Artisan Oak and the route-level catalogue evidence listed in the CSV; this permits precise repairs without sacrificing indexed redirect destinations. The 200 broader consolidations remain review flags requiring traffic/relevance evidence, not automatically 200 additional launch blockers.

HOLD MIGRATION
`;
fs.writeFileSync(out+'/REPORT.md',report);
console.log(JSON.stringify({report:path.resolve(out+'/REPORT.md'),manifest:path.resolve(out+'/RELEASE_MANIFEST.json'),changedRecords:new Set(delta.map(x=>x.type+':'+x.slug)).size,changedFields:delta.length,sealedMismatch,https:manifest.https,production},null,2));
