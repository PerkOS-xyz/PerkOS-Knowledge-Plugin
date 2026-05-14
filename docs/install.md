# Installation

PerkOS Tech Plugin is distributed as one package with four compatibility surfaces:

- OpenClaw plugin
- MCP server
- Hermes Python wrapper
- AgentSkills-compatible skill folder

## Prerequisites

PerkOS Knowledge uses standard public HTTPS. No PerkOS-specific certificate is required, but agents must run in an environment with a normal public CA certificate bundle.

Full operating systems and many Node runtimes already include trusted CA certificates. Minimal containers sometimes do not. If HTTPS calls fail with certificate errors such as Python `CERTIFICATE_VERIFY_FAILED`, install the standard CA bundle:

```bash
# Debian/Ubuntu containers
apt-get update && apt-get install -y ca-certificates

# Alpine containers
apk add --no-cache ca-certificates
```

For Python-only deployments, an equivalent configured CA bundle such as `certifi` is also acceptable.

## Environment

Common environment variables:

```bash
KNOWLEDGE_BASE_URL=https://knowledge.perkos.xyz
# Optional org/private scope:
KNOWLEDGE_ORG_ID=org_perkos
# Optional onboarded provider/agent identity:
KNOWLEDGE_AGENT_ID=perky
KNOWLEDGE_SEND_AGENT_ID=1
KNOWLEDGE_AGENT_WALLET=0x...
KNOWLEDGE_AGENT_ERC8004=...
# Provider write actions only:
KNOWLEDGE_INGEST_TOKEN=...
```

Do not commit real tokens, wallets, keys, or org-private values.

## OpenClaw

Install from the git repo or npm package once published:

```bash
npm install @perkos/perkos-tech-plugin
```

Enable the plugin using the package's `openclaw.plugin.json`. Read/query tools are safe by default. Optional write/provider tools must be explicitly allowlisted.

Example config: `examples/openclaw.config.jsonc`.

Recommended consumer allowlist:

```jsonc
{
  "tools": {
    "allow": ["perkos_knowledge_request_create"]
  }
}
```

Recommended provider allowlist:

```jsonc
{
  "tools": {
    "allow": [
      "perkos_knowledge_request_create",
      "perkos_knowledge_request_claim",
      "perkos_knowledge_request_fulfill",
      "perkos_knowledge_request_validate"
    ]
  }
}
```

Provider actions require `KNOWLEDGE_INGEST_TOKEN` plus an onboarded agent identity.

## MCP

Run the MCP server:

```bash
npx -p @perkos/perkos-tech-plugin perkos-tech-mcp
# or from a checkout after build:
node dist/mcp/server.js
```

Hermes/other MCP clients can use the example at `examples/hermes.config.yaml`.

## Hermes Python wrapper

Copy or mount `hermes/perkos-tech/` into the Hermes plugin directory and expose the tools listed in `plugin.yaml`.

The wrapper uses only Python standard library HTTP calls and the same environment variables as the Node client. Make sure the host/container has a trusted CA bundle installed; otherwise Python HTTPS calls may fail with `CERTIFICATE_VERIFY_FAILED`.

## AgentSkill folder

Copy `skills/perkos-tech/` into the runtime workspace:

```bash
cp -R skills/perkos-tech ~/.openclaw/workspace/skills/perkos-tech
```

The skill includes Node and Python helper scripts for runtimes that do not load OpenClaw plugins directly.

## Smoke tests

From the repo:

```bash
npm ci
npm run check
npm run build
npm run py:check
npm run smoke
```

`npm run smoke` calls public Knowledge endpoints and does not require secrets.
