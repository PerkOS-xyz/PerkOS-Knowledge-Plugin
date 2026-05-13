#!/usr/bin/env node
const baseUrl = (process.env.KNOWLEDGE_BASE_URL || 'https://knowledge.perkos.xyz').replace(/\/$/, '');

async function fetchJson(path, init) {
  const res = await fetch(`${baseUrl}${path}`, init);
  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${path} failed with ${res.status}: ${JSON.stringify(payload).slice(0, 500)}`);
  }
  return payload;
}

const manifest = await fetchJson('/skill/manifest');
if (!manifest?.ok || !manifest?.endpoints?.query) {
  throw new Error('manifest smoke test failed: expected ok=true and endpoints.query');
}

const policy = await fetchJson('/api/x402/policy');
if (!policy || typeof policy !== 'object') {
  throw new Error('x402 policy smoke test failed: expected JSON object');
}

const query = await fetchJson('/skill/query', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query: 'PerkOS Knowledge smoke test', limit: 1, createRequestOnMiss: false })
});
if (!query || typeof query !== 'object') {
  throw new Error('query smoke test failed: expected JSON object');
}

console.log(JSON.stringify({ ok: true, baseUrl, checks: ['manifest', 'x402-policy', 'query'] }, null, 2));
