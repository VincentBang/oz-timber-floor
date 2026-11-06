export const instructionLike = text => /\b(?:ignore|disregard|override)\b.{0,80}\b(?:instruction|policy|previous|system|rules)\b|(?:system|developer|assistant)\s*:|reveal.{0,60}(?:secret|key|prompt)|run (?:a )?tool|send.{0,40}email|you are now|api[_ -]?key|<\/?script/i.test(text);
// Upload controls/status are input UI, not evidence. Never ingest selected names,
// transient empty-state messages or instructions embedded inside this section.
// Raw source hashes still cover the entire HTML file, including this section.
// New detailed form-contract instructions remain public but quarantined from
// automatic knowledge ingestion; approved generic help is validated separately.
export function excludedNode(node){const attr=key=>node.attrs?.find(a=>a.name===key)?.value;return ['script','style','template','noscript','nav','footer'].includes(node.tagName)||attr('data-enquiry-uploads')!==undefined||attr('data-enquiry-attachment-contract')!==undefined||(attr('class')||'').split(/\s+/).includes('editorial-display')||attr('hidden')!==undefined||attr('aria-hidden')==='true'||/display\s*:\s*none|visibility\s*:\s*hidden/i.test(attr('style')||'');}
