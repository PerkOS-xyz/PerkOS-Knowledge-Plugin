#!/usr/bin/env node
import fs from 'node:fs';
import nodePath from 'node:path';

const BASE_URL = (process.env.KNOWLEDGE_BASE_URL || 'https://knowledge.perkos.xyz').replace(/\/$/, '');
const ORG_ID = process.env.KNOWLEDGE_ORG_ID || 'org_perkos';
const LLM_URL = (process.env.PERKOS_LLM_URL || 'http://127.0.0.1:5140').replace(/\/$/, '');
const MODEL = process.env.KNOWLEDGE_PROVIDER_MODEL || process.env.KNOWLEDGE_WORKER_MODEL || 'qwen2.5:7b';
const SEARCH_LIMIT = Number(process.env.KNOWLEDGE_PROVIDER_SEARCH_LIMIT || '5') || 5;

// The gateway bills whoever asks. Without a key this loop is anonymous
// traffic: it still gets an answer, but the spend lands on nobody's budget
// and no limit applies to it. The key is the same one the agent already uses.
function llmHeaders() {
  const h = { 'content-type': 'application/json' };
  if (process.env.PERKOS_LLM_API_KEY) h.authorization = `Bearer ${process.env.PERKOS_LLM_API_KEY}`;
  return h;
}

function arg(name, fallback = undefined) {
  const eq = process.argv.find((x) => x.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0) return process.argv[i + 1] ?? fallback;
  return fallback;
}

const AGENT_ID = arg('agent', process.env.KNOWLEDGE_AGENT_ID || 'perky');
const MAX = Number(arg('max', process.env.KNOWLEDGE_PROVIDER_MAX_PER_RUN || '1')) || 1;
const DRY_RUN = process.argv.includes('--dry-run');
const INCLUDE_TESTS = process.env.KNOWLEDGE_PROVIDER_INCLUDE_TESTS === '1' || process.argv.includes('--include-tests');

const profile = {
  perkyfi: {
    role: 'Markets Research Provider',
    focus: 'markets, trading, PERK/PERKOS, Base, Celo, Uniswap, wallet/token operations',
    terms: ['trading', 'trade', 'market', 'funding', 'rate', 'defi', 'perk', 'celo', 'base', 'uniswap', 'wallet', 'token', 'tokens', 'tokenized', 'stock', 'stocks', 'equity', 'equities', 'robinhood', 'xstocks', 'backed', 'kraken', 'bybit', 'liquidity', 'swap', 'slippage'],
    phrases: ['perkos token', 'price support', 'stock token', 'stock tokens', 'tokenized equities']
  },
  perky: {
    role: 'Research Librarian Provider',
    focus: 'general research, competitive intelligence, trend tracking, library/knowledge organization, uncategorized requests',
    terms: []
  },
  'perkos-agent': {
    role: 'Ecosystem Research Provider',
    focus: 'PerkOS ecosystem, architecture, x402, ERC-8004, A2A, Knowledge, agent workflows',
    terms: ['perkos', 'ecosystem', 'architecture', 'roadmap', 'agent', 'agents', 'x402', 'erc-8004', 'erc8004', 'a2a', 'knowledge', 'openclaw', 'plugin'],
    phrases: ['agent workflows', 'knowledge request lifecycle']
  }
}[AGENT_ID] || { role: 'Knowledge Provider', focus: 'general PerkOS Knowledge requests', terms: [], phrases: [] };

function log(msg) {
  console.log(`${new Date().toISOString()} ${AGENT_ID} ${msg}`);
}

function headers(auth = false) {
  const h = { 'content-type': 'application/json', 'x-agent-id': AGENT_ID, 'x-organization-id': ORG_ID };
  if (process.env.KNOWLEDGE_AGENT_WALLET) h['x-agent-wallet'] = process.env.KNOWLEDGE_AGENT_WALLET;
  if (process.env.KNOWLEDGE_AGENT_ERC8004) h['x-agent-erc8004'] = process.env.KNOWLEDGE_AGENT_ERC8004;
  if (auth && process.env.KNOWLEDGE_INGEST_TOKEN) h.authorization = `Bearer ${process.env.KNOWLEDGE_INGEST_TOKEN}`;
  return h;
}

async function api(method, path, body = undefined, auth = false) {
  const res = await fetch(`${BASE_URL}${path}`, { method, headers: headers(auth), body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
  if (!res.ok) {
    const detail = payload?.error || payload?.message || payload?.raw || res.statusText;
    throw new Error(`${method} ${path} failed ${res.status}: ${detail}`);
  }
  return payload;
}

function lowerRequest(r) {
  return `${r.query || ''} ${(r.missingTopics || []).join(' ')} ${r.desiredOutput || r.desired_output || ''}`.toLowerCase();
}

function isTestNoise(r) {
  const q = lowerRequest(r);
  return /\b(test|testing|qa|dummy|employing|hello|asdf)\b/.test(q) && q.length < 80;
}

function hasWord(q, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(q);
}

function matchesProfile(r) {
  if (isTestNoise(r) && !INCLUDE_TESTS) return false;
  if (AGENT_ID === 'perky') return true;
  const q = lowerRequest(r);
  const terms = profile.terms || [];
  const phrases = profile.phrases || [];
  return terms.some((t) => hasWord(q, t)) || phrases.some((p) => q.includes(p));
}

async function listRequests(status) {
  const data = await api('GET', `/knowledge/requests?status=${encodeURIComponent(status)}&limit=25`);
  return data?.requests || [];
}

function getPath(obj, parts) {
  let cur = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' && cur.trim() ? cur.trim() : undefined;
}

function findBraveKeyInObject(obj, trail = []) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (typeof obj.apiKey === 'string' && trail.some((p) => /brave|websearch|search/i.test(p))) {
    return obj.apiKey.trim();
  }
  for (const [key, value] of Object.entries(obj)) {
    const found = findBraveKeyInObject(value, [...trail, key]);
    if (found) return found;
  }
  return undefined;
}

function loadBraveApiKey() {
  const explicit = process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_SEARCH_TOKEN;
  if (explicit) return explicit.trim();

  const cwd = process.cwd();
  const candidates = [
    process.env.OPENCLAW_CONFIG,
    nodePath.resolve(cwd, '../home/.openclaw/openclaw.json'),
    nodePath.resolve(cwd, '../openclaw.json'),
    nodePath.resolve(cwd, '../../home/.openclaw/openclaw.json')
  ].filter(Boolean);

  for (const file of candidates) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const cfg = JSON.parse(raw);
      return (
        getPath(cfg, ['tools', 'web', 'search', 'apiKey']) ||
        getPath(cfg, ['plugins', 'entries', 'brave', 'config', 'webSearch', 'apiKey']) ||
        findBraveKeyInObject(cfg)
      );
    } catch {
      // Keep provider loop robust; missing/unparseable local OpenClaw config only disables live search.
    }
  }
  return undefined;
}

function normalizeSearchResult(item) {
  return {
    title: String(item?.title || '').replace(/\s+/g, ' ').trim(),
    url: String(item?.url || '').trim(),
    description: String(item?.description || '').replace(/\s+/g, ' ').trim()
  };
}

async function webSearch(query) {
  const key = loadBraveApiKey();
  if (!key) {
    log('WARN web_search unavailable: missing Brave API key');
    return [];
  }

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(Math.min(Math.max(SEARCH_LIMIT, 1), 10)));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number(process.env.KNOWLEDGE_PROVIDER_SEARCH_TIMEOUT_MS || 15000));
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'x-subscription-token': key },
      signal: ctrl.signal
    });
    const text = await res.text();
    if (!res.ok) {
      log(`WARN web_search failed http=${res.status}`);
      return [];
    }
    const data = JSON.parse(text);
    const results = (data?.web?.results || []).map(normalizeSearchResult).filter((r) => r.title && r.url);
    log(`web_search OK results=${results.length}`);
    return results.slice(0, SEARCH_LIMIT);
  } catch (err) {
    log(`WARN web_search failed: ${err.message}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function formatSources(sources) {
  if (!sources.length) return 'No live web search sources were available to this provider loop run.';
  return sources.map((s, i) => `${i + 1}. ${s.title}\n   URL: ${s.url}\n   Snippet: ${s.description || 'No snippet supplied.'}`).join('\n');
}

async function generateResearch(request, sources) {
  const query = request.query || '';
  const prompt = `You are ${AGENT_ID}, the ${profile.role} for PerkOS Knowledge.\n\nProvider focus: ${profile.focus}.\nKnowledge request: ${query}\nDesired output: ${request.desiredOutput || request.desired_output || 'research/context'}\nMissing topics: ${(request.missingTopics || []).join(', ') || 'none supplied'}\n\nLive web search sources checked:\n${formatSources(sources)}\n\nProduce a concise internal research response. Requirements:\n- Answer directly and practically.\n- Use the live web search sources above when they are relevant.\n- Include a short "Actionable findings" section.\n- Include an "Evidence / validation" section with the specific source URLs used.\n- Clearly separate verified facts from assumptions and unresolved questions.\n- If live external sources were not available, say so and mark the item pending validation.\n- Do not invent secrets, tokens, private keys, source URLs, or unsupported claims.\n- Keep under 900 words.`;
  const payload = { model: MODEL, stream: false, messages: [{ role: 'user', content: prompt }] };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number(process.env.KNOWLEDGE_PROVIDER_LLM_TIMEOUT_MS || 120000));
  try {
    const res = await fetch(`${LLM_URL}/api/chat`, { method: 'POST', headers: { ...llmHeaders(), 'x-agent-id': AGENT_ID }, body: JSON.stringify(payload), signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`LLM failed ${res.status}: ${text.slice(0, 200)}`);
    const data = JSON.parse(text);
    const content = data?.message?.content?.trim();
    if (!content) throw new Error('LLM returned empty content');
    return content;
  } finally {
    clearTimeout(timer);
  }
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'research';
}

function extractItemIds(payload) {
  const ids = [];
  function walk(x) {
    if (!x || typeof x !== 'object') return;
    if (typeof x.id === 'string' && x.id.startsWith('kitem_')) ids.push(x.id);
    for (const v of Object.values(x)) walk(v);
  }
  walk(payload);
  return [...new Set(ids)];
}

async function processRequest(r, alreadyClaimed = false) {
  const id = r.id;
  const query = r.query || id;
  log(`${DRY_RUN ? 'DRY ' : ''}selected request=${id} query=${query.slice(0, 140)}`);
  if (DRY_RUN) return true;

  if (!alreadyClaimed) {
    await api('POST', `/knowledge/requests/${encodeURIComponent(id)}/claim`, { notes: `Claimed by ${profile.role} (${AGENT_ID}) via provider loop.` }, true);
    log(`claimed request=${id}`);
  }

  const sources = await webSearch(query);
  const content = await generateResearch(r, sources);
  const title = `Research response: ${query}`.slice(0, 180);
  const summary = content.replace(/\s+/g, ' ').slice(0, 500);
  const path = `requests/${id}-${AGENT_ID}-${slug(query)}.md`;
  const evidence = sources.length
    ? [
        ...sources.map((s) => ({ type: 'url', url: s.url, note: s.title })),
        { type: 'note', note: `Generated by ${profile.role} (${AGENT_ID}) from PerkOS Knowledge request ${id}. Agent focus: ${profile.focus}. Live web search returned ${sources.length} result(s); content remains pending validation until independently reviewed.` }
      ]
    : [{ type: 'note', note: `Generated by ${profile.role} (${AGENT_ID}) from PerkOS Knowledge request ${id}. Agent focus: ${profile.focus}. Live web search was unavailable or returned no results; content is pending validation.` }];

  const submitted = await api('POST', '/api/ingest/research', {
    source: AGENT_ID,
    visibility: 'private',
    organization_id: ORG_ID,
    contribution_type: 'research',
    items: [{ path, title, summary, content, contribution_type: 'research', evidence }]
  }, true);
  const itemIds = extractItemIds(submitted);
  if (!itemIds.length) throw new Error(`submit succeeded but no kitem id returned for request=${id}`);

  await api('POST', `/knowledge/requests/${encodeURIComponent(id)}/fulfill`, { research_item_ids: itemIds, notes: `Fulfilled by ${profile.role} (${AGENT_ID}); pending validation/accounting.` }, true);
  log(`fulfilled request=${id} item_ids=${itemIds.join(',')}`);
  return true;
}

async function main() {
  if (!process.env.KNOWLEDGE_INGEST_TOKEN && !DRY_RUN) throw new Error('missing KNOWLEDGE_INGEST_TOKEN');
  const open = await listRequests('open');
  const claimed = await listRequests('claimed').catch(() => []);
  const candidates = [
    ...claimed.filter((r) => r.claimedByAgentId === AGENT_ID || r.claimed_by_agent_id === AGENT_ID).map((r) => ({ r, already: true })),
    ...open.filter((r) => !r.claimedByAgentId && !r.claimed_by_agent_id).map((r) => ({ r, already: false }))
  ].filter(({ r }) => matchesProfile(r));

  if (!candidates.length) {
    log('OK no matching requests');
    return;
  }

  let done = 0;
  for (const c of candidates) {
    if (done >= MAX) break;
    try {
      if (await processRequest(c.r, c.already)) done++;
    } catch (err) {
      log(`WARN failed request=${c.r.id}: ${err.message}`);
    }
  }
  log(`DONE processed=${done}`);
}

main().catch((err) => {
  log(`ERROR ${err.message}`);
  process.exit(1);
});
