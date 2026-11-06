import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { attributeBrowserException } from './browser-exception-attribution.mjs';
const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/codex-preload-observer-20261107.json', import.meta.url)));

test('captured isolated preload caller is attributed but never suppressed or called clean', () => {
  const result = attributeBrowserException(structuredClone(fixture));
  assert.equal(result.owner, 'codex-browser-preload');
  assert.equal(result.websiteCodeCaller, false);
  assert.equal(result.requiresUpstreamFix, true);
  assert.equal(result.severity, 'error');
  assert.equal(result.suppress, false);
  assert.equal(result.cleanConsole, false);
});

for (const [name, mutate] of [
  ['website/default execution world', f => { f.context.auxData.isDefault = true; }],
  ['different compiled source hash', f => { f.script.hash = 'different'; }],
  ['different source-map identity', f => { f.script.sourceMapURL = 'site.js.map'; }],
  ['website caller URL with the identical error message', f => { f.exception.stackTrace.callFrames[0].url = f.expectedOrigin + '/assets/site.js'; }],
  ['mismatched execution context', f => { f.exception.executionContextId++; }],
  ['different origin', f => { f.context.origin = 'https://oztimberfloor.com.au'; }],
  ['unrelated exception', f => { f.exception.text = 'Uncaught TypeError: unrelated'; }],
  ['missing Electron caller evidence', f => { f.exception.stackTrace.callFrames.pop(); }]
]) test('never misattributes ' + name, () => {
  const changed = structuredClone(fixture); mutate(changed);
  const result = attributeBrowserException(changed);
  assert.equal(result.owner, 'unattributed');
  assert.equal(result.requiresInvestigation, true);
  assert.equal(result.suppress, false);
  assert.equal(result.cleanConsole, false);
});

test('missing evidence fails closed and the original event is not rewritten', () => {
  const before = JSON.stringify(fixture);
  assert.equal(attributeBrowserException().owner, 'unattributed');
  const incomplete = structuredClone(fixture); delete incomplete.source;
  assert.equal(attributeBrowserException(incomplete).owner, 'unattributed');
  attributeBrowserException(fixture);
  assert.equal(JSON.stringify(fixture), before);
});
