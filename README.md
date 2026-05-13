# PerkOS Tech Plugin

Runtime-neutral PerkOS technology integration for agent runtimes.

This repo provides:

- **AgentSkill**: shared `perkos-tech` instructions for OpenClaw, Hermes, and AgentSkills-compatible runtimes.
- **OpenClaw plugin**: typed OpenClaw tools for PerkOS Knowledge, x402 policy, and identity-aware context queries.
- **Hermes plugin wrapper**: Python plugin surface for Hermes Agent.
- **MCP server**: portable tool bridge for runtimes that support Model Context Protocol.

## Capabilities

- Query PerkOS Knowledge (`knowledge.perkos.xyz`) with coverage metadata and request-on-miss support.
- Fetch PerkOS live skill manifest.
- Check x402 metering/payment policy.
- List and create Knowledge requests for missing information/skills.
- Provider request actions: claim, fulfill, and validate requests using onboarded agent identity.
- Pass optional wallet, ERC-8004 identity, organization, and provider token headers.
- Keep public/private knowledge handling explicit and safe.

## Security defaults

- Public queries work without identity headers.
- Wallet/ERC-8004/org headers are opt-in via environment/config.
- `x-agent-id` is disabled by default until the agent is onboarded in Knowledge.
- No secrets, private keys, or real wallets belong in this repo.
- Write/payment/provider tools are optional/approval-sensitive in OpenClaw and require explicit allowlisting plus `KNOWLEDGE_INGEST_TOKEN`.

## Layout

```text
perkos-tech-plugin/
├── openclaw.plugin.json
├── package.json
├── src/                 # OpenClaw plugin + shared client
├── mcp/                 # Runtime-neutral MCP server
├── skills/perkos-tech/  # AgentSkill shared by OpenClaw/Hermes
├── hermes/perkos-tech/  # Hermes plugin wrapper
└── examples/            # Runtime config examples
```

## Status

MVP plugin scaffold with read tools enabled by default and request/provider write tools exposed as opt-in capabilities.

## Tool surface

Default/read tools:

- `perkos_knowledge_query`
- `perkos_skill_manifest`
- `perkos_x402_policy`
- `perkos_knowledge_requests_list`

Optional/write/provider tools:

- `perkos_knowledge_request_create`
- `perkos_knowledge_request_claim`
- `perkos_knowledge_request_fulfill`
- `perkos_knowledge_request_validate`

OpenClaw users should allow optional tools explicitly, e.g. `tools.allow: ["perkos-tech"]` or specific tool names, and only on trusted provider agents.

## Install and release docs

- Installation: `docs/install.md`
- Runtime compatibility matrix: `docs/runtime-matrix.md`
- Release checklist: `docs/release.md`

## Local verification

```bash
npm ci
npm run check
npm run build
npm run py:check
npm run smoke
npm run pack:dry-run
```

`npm run smoke` only calls public Knowledge endpoints and does not require secrets.
