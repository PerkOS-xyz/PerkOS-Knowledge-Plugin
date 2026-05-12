#!/usr/bin/env node
import fs from 'node:fs';

const BASE_URL = (process.env.KNOWLEDGE_BASE_URL || 'https://knowledge.perkos.xyz').replace(/\/$/, '');

function openclawAgentId() {
  if (process.env.KNOWLEDGE_SEND_AGENT_ID !== '1') return null;
  for (const path of ['/root/.openclaw/openclaw.json', `${process.env.HOME || ''}/.openclaw/openclaw.json`]) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path, 'utf8'));
      return cfg?.models?.providers?.ollama?.headers?.['x-agent-id'] || null;
    } catch {}
  }
  return null;
}

function headers() {
  const h = { 'content-type': 'application/json' };
  const agentId = openclawAgentId();
  if (agentId) h['x-agent-id'] = agentId;
  if (process.env.KNOWLEDGE_AGENT_WALLET) h['x-agent-wallet'] = process.env.KNOWLEDGE_AGENT_WALLET;
  if (process.env.KNOWLEDGE_AGENT_ERC8004) h['x-agent-erc8004'] = process.env.KNOWLEDGE_AGENT_ERC8004;
  if (process.env.KNOWLEDGE_ORG_ID) h['x-organization-id'] = process.env.KNOWLEDGE_ORG_ID;
  return h;
}

async function req(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
  console.log(JSON.stringify(payload, null, 2));
  if (!res.ok) process.exit(1);
}

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || ['manifest', 'x402-policy', 'query'].includes(cmd) === false) {
  console.error('Usage: node skills/perkos-tech/scripts/perkos_tech.mjs manifest|x402-policy|query "question" [--limit N]');
  process.exit(2);
}

if (cmd === 'manifest') await req('GET', '/skill/manifest');
else if (cmd === 'x402-policy') await req('GET', '/api/x402/policy');
else {
  const limitIndex = rest.indexOf('--limit');
  let limit = Number(process.env.KNOWLEDGE_LIMIT || 5);
  if (limitIndex >= 0) {
    limit = Number(rest[limitIndex + 1] || limit);
    rest.splice(limitIndex, 2);
  }
  const query = rest.join(' ').trim();
  if (!query) {
    console.error('query required');
    process.exit(2);
  }
  await req('POST', '/skill/query', { query, limit });
}
