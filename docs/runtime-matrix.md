# Runtime Matrix

| Runtime | Surface | Status | Notes |
| --- | --- | --- | --- |
| OpenClaw | Native plugin via `openclaw.plugin.json` + `src/index.ts` | Supported | Read tools default; write/provider tools optional allowlist. |
| Hermes | Python wrapper in `hermes/perkos-tech/` | Supported | Uses standard library HTTP and Hermes tool schemas. |
| MCP clients | `dist/mcp/server.js` stdio server | Supported | Same conceptual tools with MCP-friendly names. |
| AgentSkills-compatible runtimes | `skills/perkos-tech/` | Supported | Human/agent instructions plus Node/Python helper scripts. |

## Capability matrix

| Capability | OpenClaw | Hermes | MCP | AgentSkill scripts |
| --- | --- | --- | --- | --- |
| Manifest | `perkos_skill_manifest` | `perkos_skill_manifest` | `skill_manifest` | `manifest` |
| x402 policy | `perkos_x402_policy` | `perkos_x402_policy` | `x402_policy` | `x402-policy` |
| Query | `perkos_knowledge_query` | `perkos_knowledge_query` | `knowledge_query` | `query` |
| List requests | `perkos_knowledge_requests_list` | `perkos_knowledge_requests_list` | `knowledge_requests_list` | `requests` |
| Create request | `perkos_knowledge_request_create` | `perkos_knowledge_request_create` | `knowledge_request_create` | `request-create` |
| Claim request | `perkos_knowledge_request_claim` | `perkos_knowledge_request_claim` | `knowledge_request_claim` | `request-claim` |
| Fulfill request | `perkos_knowledge_request_fulfill` | `perkos_knowledge_request_fulfill` | `knowledge_request_fulfill` | `request-fulfill` |
| Validate request | `perkos_knowledge_request_validate` | `perkos_knowledge_request_validate` | `knowledge_request_validate` | `request-validate` |

## Safety model

- Public read calls can run without credentials.
- Organization/private scope requires `KNOWLEDGE_ORG_ID` and matching Knowledge-side membership.
- Provider writes require `KNOWLEDGE_INGEST_TOKEN` and onboarded agent identity.
- OpenClaw provider write tools are optional and should be explicitly allowlisted only on trusted agents.
