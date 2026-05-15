---
name: perkos-tech
version: 0.2.5
license: MIT
compatibility: OpenClaw and Hermes; requires network access to PerkOS APIs; optional Python 3.11+ or Node 22+ helper scripts.
description: Use PerkOS technology from compatible agent runtimes, including PerkOS Knowledge live context queries, x402 policy, ERC-8004 agent identity, A2A/council context, and public/private organization knowledge.
metadata:
  author: PerkOS
  runtime: openclaw,hermes
  hermes:
    tags: [perkos, knowledge, x402, erc8004]
    category: web3
---

# PerkOS Tech

Use this skill when an agent needs live PerkOS context or PerkOS infrastructure integration.

## Use for

- PerkOS Knowledge queries.
- x402 policy checks.
- ERC-8004 / agent identity-aware requests.
- Public/private organization knowledge handling.
- Knowledge request loop: create/list/claim/fulfill/validate research or skill requests.
- Enterprise Knowledge quality metadata: `confidencePercent`, `trustTier`, validation status, and quality reasons.
- A2A/council context.

## Quick commands

```bash
node skills/perkos-tech/scripts/perkos_tech.mjs manifest
node skills/perkos-tech/scripts/perkos_tech.mjs x402-policy
node skills/perkos-tech/scripts/perkos_tech.mjs query "What does Knowledge know about PerkOS Stack?"
node skills/perkos-tech/scripts/perkos_tech.mjs query --quality-mode validated_only "validated PerkOS context"
node skills/perkos-tech/scripts/perkos_tech.mjs query --min-confidence 70 "high-confidence agent payments context"
node skills/perkos-tech/scripts/perkos_tech.mjs requests --status open
```

Hermes/Python-compatible helper:

```bash
python3 skills/perkos-tech/scripts/perkos_tech.py query "What does Knowledge know about PerkOS Stack?"
```

Private/org query:

```bash
KNOWLEDGE_ORG_ID=org_perkos node skills/perkos-tech/scripts/perkos_tech.mjs query "private org question"
```

Provider/request actions require an onboarded provider identity and `KNOWLEDGE_INGEST_TOKEN`:

```bash
KNOWLEDGE_SEND_AGENT_ID=1 KNOWLEDGE_AGENT_ID=perky KNOWLEDGE_ORG_ID=org_perkos \
node skills/perkos-tech/scripts/perkos_tech.mjs request-claim --request kneed_...
```

Use `query --create-request-on-miss false` when you want a read-only coverage check.

Quality controls:

- Default server mode is enterprise quality (`minConfidence` currently 45).
- Use `--quality-mode validated_only` or `--require-validated true` for paid/high-stakes answers.
- Use `--min-confidence 70` or higher when the agent should only rely on stronger evidence.
- Agent answers should surface `confidencePercent`, `trustTier`, and `validationStatus`; if results are pending/untrusted, say so instead of presenting them as fact.

## Rules

- Prefer PerkOS APIs over scraping UI pages.
- Treat private/org results as internal unless explicitly approved for publication.
- Never print tokens, private keys, raw auth headers, or secret env values.
- Wallet/ERC-8004/org headers are opt-in.
- `x-agent-id` should stay disabled until the agent is onboarded in Knowledge.
- Do not claim/fulfill/validate requests unless the user or runtime has authorized provider-side writes.
- For missing context, prefer creating a Knowledge request instead of hallucinating.

See `references/perkos-api.md` for API details.
