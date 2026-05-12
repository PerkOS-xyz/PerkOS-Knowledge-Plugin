---
name: perkos-tech
version: 0.1.0
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
- A2A/council context.

## Quick commands

```bash
node skills/perkos-tech/scripts/perkos_tech.mjs manifest
node skills/perkos-tech/scripts/perkos_tech.mjs x402-policy
node skills/perkos-tech/scripts/perkos_tech.mjs query "What does Knowledge know about PerkOS Stack?"
```

Hermes/Python-compatible helper:

```bash
python3 skills/perkos-tech/scripts/perkos_tech.py query "What does Knowledge know about PerkOS Stack?"
```

Private/org query:

```bash
KNOWLEDGE_ORG_ID=org_perkos node skills/perkos-tech/scripts/perkos_tech.mjs query "private org question"
```

## Rules

- Prefer PerkOS APIs over scraping UI pages.
- Treat private/org results as internal unless explicitly approved for publication.
- Never print tokens, private keys, raw auth headers, or secret env values.
- Wallet/ERC-8004/org headers are opt-in.
- `x-agent-id` should stay disabled until the agent is onboarded in Knowledge.

See `references/perkos-api.md` for API details.
