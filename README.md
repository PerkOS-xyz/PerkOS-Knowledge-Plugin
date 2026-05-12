# PerkOS Tech Plugin

Runtime-neutral PerkOS technology integration for agent runtimes.

This repo provides:

- **AgentSkill**: shared `perkos-tech` instructions for OpenClaw, Hermes, and AgentSkills-compatible runtimes.
- **OpenClaw plugin**: typed OpenClaw tools for PerkOS Knowledge, x402 policy, and identity-aware context queries.
- **Hermes plugin wrapper**: Python plugin surface for Hermes Agent.
- **MCP server**: portable tool bridge for runtimes that support Model Context Protocol.

## Capabilities

- Query PerkOS Knowledge (`knowledge.perkos.xyz`).
- Fetch PerkOS live skill manifest.
- Check x402 metering/payment policy.
- Pass optional wallet, ERC-8004 identity, and organization headers.
- Keep public/private knowledge handling explicit and safe.

## Security defaults

- Public queries work without identity headers.
- Wallet/ERC-8004/org headers are opt-in via environment/config.
- `x-agent-id` is disabled by default until the agent is onboarded in Knowledge.
- No secrets, private keys, or real wallets belong in this repo.
- Write/payment/ingest tools should be opt-in and approval-sensitive.

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

Initial scaffold. Tool implementations are intentionally small and read-only first.
