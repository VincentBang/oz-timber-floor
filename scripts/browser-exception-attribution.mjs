// Diagnostic attribution only. This does not suppress exceptions or relax QA.
const CAPTURED_PRELOAD_SHA256 = '81aa5f9c4fa787ccba4ffed034fb793cfa4391e76f96b3d3d8a18b4430301fb7';
const OBSERVER_MESSAGE = "Uncaught TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.";
const OBSERVER_EXPRESSION = 'r.observe(t.documentElement,tS.LJ)';

function frames(stack) {
  return [...(stack?.callFrames || []), ...(stack?.parent ? frames(stack.parent) : [])];
}

export function attributeBrowserException({ exception, script, context, source, expectedOrigin } = {}) {
  const unknown = { owner: 'unattributed', severity: 'error', suppress: false, cleanConsole: false, requiresInvestigation: true };
  if (!exception || !script || !context || !source || !expectedOrigin) return unknown;
  const first = exception.stackTrace?.callFrames?.[0];
  const matched = exception.text === OBSERVER_MESSAGE &&
    exception.executionContextId === context.id && script.executionContextId === context.id &&
    context.name === 'Electron Isolated Context' && context.origin === expectedOrigin &&
    context.auxData?.isDefault === false && context.auxData?.type === 'isolated' &&
    script.executionContextAuxData?.isDefault === false && script.executionContextAuxData?.type === 'isolated' &&
    context.auxData.frameId === script.executionContextAuxData.frameId &&
    script.sourceMapURL === 'browser-page-preload.js.map' && script.url === '' && script.hasSourceURL === false &&
    script.hash === CAPTURED_PRELOAD_SHA256 && source.sha256 === CAPTURED_PRELOAD_SHA256 &&
    source.observerExpression === OBSERVER_EXPRESSION &&
    exception.scriptId === script.scriptId && first?.scriptId === script.scriptId && first.url === '' &&
    exception.lineNumber === 114 && exception.columnNumber === 63582 &&
    first.lineNumber === exception.lineNumber && first.columnNumber === exception.columnNumber &&
    frames(exception.stackTrace).some(frame => frame.url === 'node:electron/js2c/sandbox_bundle');
  if (!matched) return unknown;
  return {
    owner: 'codex-browser-preload', severity: 'error', suppress: false, cleanConsole: false,
    requiresInvestigation: false, requiresUpstreamFix: true, websiteCodeCaller: false,
    evidence: { sourceMapURL: script.sourceMapURL, sha256: script.hash, line: 115, column: 63583 }
  };
}
