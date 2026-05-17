# PerkOS LLM usage helper

The skill includes an `llm-usage` helper for reading usage aggregates from the PerkOS LLM proxy. This is intended for operations and pay-per-use preparation.

## Node

```bash
PERKOS_LLM_URL=https://api.llm.perkos.xyz \
PERKOS_LLM_ADMIN_TOKEN=$ADMIN_TOKEN \
node skills/perkos-tech/scripts/perkos_tech.mjs llm-usage --hours 24 --limit 10000
```

## Python / Hermes

```bash
PERKOS_LLM_URL=https://api.llm.perkos.xyz \
PERKOS_LLM_ADMIN_TOKEN=$ADMIN_TOKEN \
python3 skills/perkos-tech/scripts/perkos_tech.py llm-usage --hours 24 --limit 10000
```

## Self filter

Use `--self` to keep only the current agent when `KNOWLEDGE_AGENT_ID` is set or when `KNOWLEDGE_SEND_AGENT_ID=1` can read the OpenClaw `x-agent-id`.

```bash
PERKOS_LLM_ADMIN_TOKEN=$ADMIN_TOKEN \
KNOWLEDGE_SEND_AGENT_ID=1 KNOWLEDGE_AGENT_ID=perkos-trading \
node skills/perkos-tech/scripts/perkos_tech.mjs llm-usage --hours 24 --self
```

## Environment

- `PERKOS_LLM_URL`: defaults to `https://api.llm.perkos.xyz`.
- `PERKOS_LLM_ADMIN_TOKEN` or `ADMIN_TOKEN`: bearer token for `/admin/llm-usage`.

Never commit admin tokens or print them in logs.
