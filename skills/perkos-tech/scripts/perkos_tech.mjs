#!/usr/bin/env node
import fs from 'node:fs';

const BASE_URL = (process.env.KNOWLEDGE_BASE_URL || 'https://knowledge.perkos.xyz').replace(/\/$/, '');

function openclawAgentId() {
  if (process.env.KNOWLEDGE_SEND_AGENT_ID !== '1') return null;
  for (const path of ['/root/.openclaw/openclaw.json', `${process.env.HOME || ''}/.openclaw/openclaw.json`]) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));
      return cfg?.models?.providers?.ollama?.headers?.['x-agent-id'] || process.env.KNOWLEDGE_AGENT_ID || null;
    } catch {}
  }
  return process.env.KNOWLEDGE_AGENT_ID || null;
}

function headers(auth = false) {
  const h = { 'content-type': 'application/json' };
  const agentId = openclawAgentId();
  if (agentId) h['x-agent-id'] = agentId;
  if (process.env.KNOWLEDGE_AGENT_WALLET) h['x-agent-wallet'] = process.env.KNOWLEDGE_AGENT_WALLET;
  if (process.env.KNOWLEDGE_AGENT_ERC8004) h['x-agent-erc8004'] = process.env.KNOWLEDGE_AGENT_ERC8004;
  if (process.env.KNOWLEDGE_ORG_ID) h['x-organization-id'] = process.env.KNOWLEDGE_ORG_ID;
  if (auth && process.env.KNOWLEDGE_INGEST_TOKEN) h.authorization = `Bearer ${process.env.KNOWLEDGE_INGEST_TOKEN}`;
  return h;
}

async function req(method, path, body, auth = false) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(auth),
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
  console.log(JSON.stringify(payload, null, 2));
  if (!res.ok) process.exit(1);
}

function take(args, name, fallback = undefined) {
  const i = args.indexOf(`--${name}`);
  if (i >= 0) return args.splice(i, 2)[1] ?? fallback;
  const prefix = `--${name}=`;
  const j = args.findIndex((x) => x.startsWith(prefix));
  if (j >= 0) return args.splice(j, 1)[0].slice(prefix.length);
  return fallback;
}

const [cmd, ...rest0] = process.argv.slice(2);
const rest = [...rest0];
const usage = 'Usage: perkos_tech.mjs manifest|x402-policy|query|requests|request-create|request-claim|request-fulfill|request-validate ...';
if (!cmd) { console.error(usage); process.exit(2); }

if (cmd === 'manifest') await req('GET', '/skill/manifest');
else if (cmd === 'x402-policy') await req('GET', '/api/x402/policy');
else if (cmd === 'query') {
  const limit = Number(take(rest, 'limit', process.env.KNOWLEDGE_LIMIT || 5));
  const create = take(rest, 'create-request-on-miss', undefined);
  const desired = take(rest, 'desired-output', undefined);
  const query = rest.join(' ').trim();
  if (!query) { console.error('query required'); process.exit(2); }
  await req('POST', '/skill/query', { query, limit, createRequestOnMiss: create === undefined ? undefined : create !== 'false', desired_output: desired });
} else if (cmd === 'requests') {
  const status = encodeURIComponent(take(rest, 'status', 'open'));
  const limit = encodeURIComponent(take(rest, 'limit', '25'));
  await req('GET', `/knowledge/requests?status=${status}&limit=${limit}`);
} else if (cmd === 'request-create') {
  const priority = take(rest, 'priority', undefined);
  const desired = take(rest, 'desired-output', undefined);
  const query = rest.join(' ').trim();
  if (!query) { console.error('query required'); process.exit(2); }
  await req('POST', '/knowledge/requests', { query, priority, desired_output: desired });
} else if (cmd === 'request-claim') {
  const requestId = take(rest, 'request') || rest[0];
  if (!requestId) { console.error('request id required'); process.exit(2); }
  await req('POST', `/knowledge/requests/${encodeURIComponent(requestId)}/claim`, { notes: take(rest, 'notes', undefined) }, true);
} else if (cmd === 'request-fulfill') {
  const requestId = take(rest, 'request') || rest[0];
  const itemIds = (take(rest, 'item-ids', '') || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (!requestId || !itemIds.length) { console.error('request id and --item-ids required'); process.exit(2); }
  await req('POST', `/knowledge/requests/${encodeURIComponent(requestId)}/fulfill`, { research_item_ids: itemIds, notes: take(rest, 'notes', undefined) }, true);
} else if (cmd === 'request-validate') {
  const requestId = take(rest, 'request') || rest[0];
  if (!requestId) { console.error('request id required'); process.exit(2); }
  await req('POST', `/knowledge/requests/${encodeURIComponent(requestId)}/validate`, { accepted: take(rest, 'accepted', 'true') !== 'false', validation_notes: take(rest, 'notes', undefined) }, true);
} else {
  console.error(usage);
  process.exit(2);
}
