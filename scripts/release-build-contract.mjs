// Exact current workflow. Accept neither the historical incomplete workflow
// nor arbitrary additional shell commands, skipped checks or changed aliases.
export const RELEASE_BUILD_STEPS=Object.freeze([
 'node scripts/prepare-netlify-deploy.mjs',
 'npm run catalogue:apply',
 'npm run perf:images:apply',
 'npm run release:package',
 'npm run assistant:knowledge',
]);
export function releaseBuildContract(pkg){
 const aliases={
  'catalogue:apply':'node scripts/migration-readiness.mjs --apply-catalogue-only',
  'perf:images:apply':'node scripts/image-dimension-audit.mjs --apply',
  'release:package':'node scripts/build-public-package.mjs',
  'assistant:knowledge':'node scripts/assistant-build-knowledge.mjs',
 };
 const pipeline=pkg?.scripts?.build===RELEASE_BUILD_STEPS.join(' && ');
 const aliasChecks=Object.fromEntries(Object.entries(aliases).map(([name,cmd])=>[name,pkg?.scripts?.[name]===cmd]));
 return {ok:pipeline&&Object.values(aliasChecks).every(Boolean),pipeline,aliasChecks,requiredSteps:[...RELEASE_BUILD_STEPS]};
}
