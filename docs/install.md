# Installation

PerkOS Tech Plugin is distributed as one package with four compatibility surfaces:

- OpenClaw plugin
- MCP server
- Hermes Python wrapper
- AgentSkills-compatible skill folder

For role-specific setup, tool allowlists, environment variables, and end-to-end
consumer/provider/validator processes, start with
`docs/agent-role-integration.md`.

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
# Optional query quality defaults for agents:
KNOWLEDGE_QUALITY_MODE=enterprise
KNOWLEDGE_MIN_CONFIDENCE=45
```

Do not commit real tokens, wallets, keys, or org-private values.

## OpenClaw

Install from the git repo or npm package once published:

```bash
npm install @perkos/perkos-knowledge-plugin
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
      "perkos_knowledge_request_validate",
      "perkos_knowledge_submit_research"
    ]
  }
}
```

Provider actions require `KNOWLEDGE_INGEST_TOKEN` plus an onboarded agent identity.

For paid/high-stakes consumers, configure calls with `qualityMode=validated_only`, `requireValidated=true`, or a higher `minConfidence` threshold. Agents should surface `confidencePercent`, `trustTier`, and `validationStatus` when summarizing Knowledge results.

## MCP

Run the MCP server:

```bash
npx -p @perkos/perkos-knowledge-plugin perkos-knowledge-mcp
# or from a checkout after build:
node dist/mcp/server.js
```

Hermes/other MCP clients can use the example at `examples/hermes.config.yaml`.

## Hermes Agent real runtime

For a real Hermes Agent container or host install, copy or mount `hermes/perkos-knowledge/` into the Hermes plugin directory and enable it in Hermes config:

```yaml
plugins:
  enabled:
    - perkos-knowledge
  disabled: []
```

Recommended layout for a Docker-backed Hermes Agent:

```bash
# Hermes data volume, for example /opt/data inside nousresearch/hermes-agent
mkdir -p /opt/data/plugins /opt/data/skills/perkos
cp -R hermes/perkos-knowledge /opt/data/plugins/perkos-knowledge
cp -R skills/perkos-knowledge /opt/data/skills/perkos/perkos-knowledge
```

Then restart Hermes so plugin discovery reloads. Verify:

```bash
hermes plugins list | grep perkos-knowledge
hermes tools list | grep -i perkos
python3 /opt/data/skills/perkos/perkos-knowledge/scripts/perkos_tech.py manifest
```

When the same Hermes agent uses the PerkOS LLM proxy, configure it as a custom provider using chat-completions transport. Production testing against `api.llm.perkos.xyz` showed Hermes `api_mode: responses` can fail upstream with `401 Missing Authentication header`; `chat_completions` works while the Hermes outer `/v1/responses` API still works.

See `examples/hermes-agent.config.yaml`.

The wrapper uses only Python standard library HTTP calls and the same environment variables as the Node client. Make sure the host/container has a trusted CA bundle installed; otherwise Python HTTPS calls may fail with `CERTIFICATE_VERIFY_FAILED`.

## AgentSkill folder

Copy `skills/perkos-knowledge/` into the runtime workspace:

```bash
cp -R skills/perkos-knowledge ~/.openclaw/workspace/skills/perkos-knowledge
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
