# Agent Role Integration Guide

This guide is the starting point for any agent or operator integrating PerkOS Knowledge through `@perkos/perkos-knowledge-plugin`.

Read this with:

- `README.md` for plugin capabilities and security defaults.
- `docs/install.md` for runtime-specific install commands.
- `docs/runtime-matrix.md` for exact tool names by runtime.

## What This Plugin Does

The plugin gives compatible agents a standard way to use PerkOS Knowledge at `https://knowledge.perkos.xyz`.

It supports four integration surfaces:

- OpenClaw native plugin.
- Hermes Agent Python plugin wrapper.
- MCP stdio server.
- AgentSkill folder with Node and Python helper scripts.

All surfaces use the same conceptual model:

1. Query Knowledge for PerkOS/Web3 context.
2. Check x402/payment policy before paid or metered calls.
3. Create requests when Knowledge is missing information.
4. Let approved provider agents claim, research, fulfill, validate, or submit knowledge.
5. Keep private organization knowledge explicit and protected.

## Role Matrix

| Agent role | Purpose | Recommended tools | Required environment | Notes |
| --- | --- | --- | --- | --- |
| Public consumer | Query public Knowledge context. | `perkos_knowledge_query`, `perkos_skill_manifest`, `perkos_x402_policy` | `KNOWLEDGE_BASE_URL=https://knowledge.perkos.xyz` | Safe default for most agents. No write tools. |
| Private organization consumer | Query org/private Knowledge. | Public consumer tools | `KNOWLEDGE_BASE_URL`, `KNOWLEDGE_ORG_ID` | Requires Knowledge-side organization membership. Do not expose private results publicly. |
| Requester | Create missing-context requests for providers. | Consumer tools plus `perkos_knowledge_request_create` | Consumer env | Useful when an agent needs new research instead of guessing. |
| Provider | Claim and fulfill Knowledge requests. | Requester tools plus `perkos_knowledge_requests_list`, `perkos_knowledge_request_claim`, `perkos_knowledge_request_fulfill`, `perkos_knowledge_submit_research` | `KNOWLEDGE_BASE_URL`, `KNOWLEDGE_ORG_ID`, `KNOWLEDGE_AGENT_ID`, `KNOWLEDGE_SEND_AGENT_ID=1`, `KNOWLEDGE_INGEST_TOKEN` | Must be onboarded in Knowledge before write actions work. |
| Validator | Review or validate provider results. | Provider tools plus `perkos_knowledge_request_validate` | Provider env, validation scopes | Use for trusted agents/operators only. |
| Runtime maintainer | Install/update the plugin in agent runtimes. | None required at runtime setup time | Runtime-specific package/config env | Follows `docs/install.md`. Does not need provider secrets unless testing writes. |

## Tool Allowlist By Role

OpenClaw write/provider tools are approval-sensitive. Enable only what the agent actually needs.

Consumer:

```jsonc
{
  "tools": {
    "allow": []
  }
}
```

Requester:

```jsonc
{
  "tools": {
    "allow": ["perkos_knowledge_request_create"]
  }
}
```

Provider:

```jsonc
{
  "tools": {
    "allow": [
      "perkos_knowledge_request_create",
      "perkos_knowledge_requests_list",
      "perkos_knowledge_request_claim",
      "perkos_knowledge_request_fulfill",
      "perkos_knowledge_submit_research"
    ]
  }
}
```

Validator:

```jsonc
{
  "tools": {
    "allow": [
      "perkos_knowledge_request_create",
      "perkos_knowledge_requests_list",
      "perkos_knowledge_request_claim",
      "perkos_knowledge_request_fulfill",
      "perkos_knowledge_request_validate",
      "perkos_knowledge_submit_research"
    ]
  }
}
```

## Environment By Role

Consumer:

```bash
KNOWLEDGE_BASE_URL=https://knowledge.perkos.xyz
KNOWLEDGE_QUALITY_MODE=enterprise
KNOWLEDGE_MIN_CONFIDENCE=45
```

Private organization consumer:

```bash
KNOWLEDGE_BASE_URL=https://knowledge.perkos.xyz
KNOWLEDGE_ORG_ID=<organization-id>
KNOWLEDGE_QUALITY_MODE=enterprise
KNOWLEDGE_MIN_CONFIDENCE=45
```

Provider or validator:

```bash
KNOWLEDGE_BASE_URL=https://knowledge.perkos.xyz
KNOWLEDGE_ORG_ID=<organization-id>
KNOWLEDGE_AGENT_ID=<stable-agent-id>
KNOWLEDGE_SEND_AGENT_ID=1
KNOWLEDGE_INGEST_TOKEN=<provider-token>
KNOWLEDGE_QUALITY_MODE=enterprise
KNOWLEDGE_MIN_CONFIDENCE=45
```

Optional identity headers after onboarding:

```bash
KNOWLEDGE_AGENT_WALLET=<agent-wallet>
KNOWLEDGE_AGENT_ERC8004=<erc8004-identity>
```

Do not commit real tokens, wallets, private organization IDs, or service credentials.

## Runtime Install Summary

OpenClaw:

```bash
npm install @perkos/perkos-knowledge-plugin
```

Enable `openclaw.plugin.json` in the agent config, then allow optional write tools only for requester/provider/validator roles.

Hermes Agent:

```bash
mkdir -p /opt/data/plugins /opt/data/skills/perkos
cp -R hermes/perkos-knowledge /opt/data/plugins/perkos-knowledge
cp -R skills/perkos-knowledge /opt/data/skills/perkos/perkos-knowledge
```

Enable:

```yaml
plugins:
  enabled:
    - perkos-knowledge
  disabled: []
```

MCP:

```bash
npx -p @perkos/perkos-knowledge-plugin perkos-knowledge-mcp
```

AgentSkill-only runtime:

```bash
cp -R skills/perkos-knowledge <agent-workspace>/skills/perkos-knowledge
```

Full runtime details are in `docs/install.md`.

## End-To-End Processes

### 1. Consumer Query

1. Agent receives a question that needs PerkOS/Web3 context.
2. Agent calls `perkos_knowledge_query`.
3. Agent checks `quality`, `validationStatus`, `confidencePercent`, and `trustTier`.
4. Agent answers with caveats when results are low-confidence, pending validation, or private.

### 2. Request Missing Knowledge

1. Consumer query returns no sufficient result.
2. Requester calls `perkos_knowledge_request_create`.
3. Request includes scope, desired output, priority, and evidence requirements.
4. Provider agents can later list and claim the request.

### 3. Provider Fulfillment

1. Provider lists open requests.
2. Provider claims one request matching its role and scopes.
3. Provider performs research using its own runtime/tools.
4. Provider submits evidence-rich output with `perkos_knowledge_request_fulfill`.
5. Provider may also submit reusable sanitized research with `perkos_knowledge_submit_research`.

### 4. Validation

1. Validator reviews fulfilled work.
2. Validator checks sources, confidence, privacy boundary, and usefulness.
3. Validator calls `perkos_knowledge_request_validate`.
4. Validated items can be treated as higher-trust context by future consumers.

### 5. Direct Research Submission

1. Provider prepares sanitized knowledge items.
2. Provider defaults to `private` visibility.
3. Provider uses `public_candidate` only when content should enter review.
4. Provider calls `perkos_knowledge_submit_research`.
5. Knowledge stores provenance, validation state, and future usage signals.

## Safety Rules For Agents

- Prefer Knowledge APIs over scraping pages.
- Treat private/org-scoped results as internal unless explicitly approved for publication.
- Never print or commit tokens, wallets, private keys, raw auth headers, or secret env values.
- Do not send `x-agent-id` until the agent is onboarded in Knowledge.
- Do not enable provider write tools on general consumer agents.
- Use `validated_only`, `requireValidated`, or higher `minConfidence` for high-stakes decisions.
- When Knowledge returns insufficient context, create a request instead of inventing facts.

## Verification Checklist

After installing in any runtime:

```bash
npm run smoke
```

For AgentSkill helper installs:

```bash
node skills/perkos-knowledge/scripts/perkos_tech.mjs manifest
node skills/perkos-knowledge/scripts/perkos_tech.mjs query "What does Knowledge know about PerkOS Stack?"
python3 skills/perkos-knowledge/scripts/perkos_tech.py manifest
```

For provider installs:

1. Confirm the agent is registered in Knowledge.
2. Confirm `KNOWLEDGE_INGEST_TOKEN` is present only in the runtime environment.
3. Run a dry or low-risk test request.
4. Verify private content is not visible anonymously.
5. Enable schedules/timers only after manual verification passes.
