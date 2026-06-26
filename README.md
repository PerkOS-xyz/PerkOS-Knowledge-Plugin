# PerkOS Knowledge Plugin

Runtime-neutral PerkOS Knowledge integration for agent runtimes.

This repo provides:

- **AgentSkill**: shared `perkos-knowledge` instructions for OpenClaw, Hermes, and AgentSkills-compatible runtimes.
- **OpenClaw plugin**: typed OpenClaw tools for PerkOS Knowledge, x402 policy, and identity-aware context queries.
- **Hermes plugin wrapper**: Python plugin surface for Hermes Agent.
- **MCP server**: portable tool bridge for runtimes that support Model Context Protocol.

## Capabilities

- Query PerkOS Knowledge (`knowledge.perkos.xyz`) with coverage metadata and request-on-miss support.
- Multi-chain billing: choose the **pay-chain** (`base` | `celo`) per call or via env; spend that chain's prepaid balance, providers earn there.
- Turn a billing `402` into a plain-language `hint` (top up via `POST /api/deposit`) so the model can self-recover.
- Fetch PerkOS live skill manifest.
- Check x402 metering/payment policy.
- List and create Knowledge requests for missing information/skills.
- Provider request actions: claim, fulfill, and validate requests using onboarded agent identity.
- Provider contribution action: submit sanitized research items directly into PerkOS Knowledge.
- Pass optional wallet, ERC-8004 identity, organization, and provider token headers.
- Keep public/private knowledge handling explicit and safe.

## Agent workflow

PerkOS Knowledge is a **two-sided market**: agents *consume* knowledge by querying it (paying per query from a prepaid credit balance) and *provide* knowledge by contributing research (earning credits when their contributions answer someone else's paid query). This plugin exposes both paths as tools.

```mermaid
flowchart TD
    A([Agent]) --> M{Goal?}

    %% ---------- CONSUME ----------
    M -->|Need knowledge| Q["perkos_knowledge_query<br/>POST /skill/query · payChain base|celo"]
    Q --> COV{"Coverage<br/>sufficient?"}
    COV -->|Yes| PAY{Tier?}
    PAY -->|public is free| CTX["Ranked, source-cited context<br/>returned to your own LLM"]
    PAY -->|private / premium| DEB["Debit prepaid credits<br/>on the pay-chain"]
    DEB -->|balance ok| CTX
    DEB -->|HTTP 402| HINT["plain-language hint:<br/>top up via POST /api/deposit"]
    HINT -. fund then retry .-> Q
    COV -->|No| REQ["Auto-open a Knowledge request<br/>createRequestOnMiss=true"]

    %% ---------- PROVIDE ----------
    M -->|Provide knowledge| LIST["perkos_knowledge_requests_list<br/>GET /knowledge/requests?status=open"]
    REQ -. becomes work for .-> LIST
    LIST --> CLAIM["perkos_knowledge_request_claim"]
    CLAIM --> FUL["perkos_knowledge_request_fulfill<br/>research + evidence"]
    FUL --> VAL["perkos_knowledge_request_validate"]
    VAL --> IDX[("Indexed in PerkOS Knowledge")]
    M -->|Have research now| SUB["perkos_knowledge_submit_research<br/>POST /api/ingest/research"]
    SUB --> IDX

    %% ---------- EARN + CLAIM ----------
    CTX -. value split equally across the answering items .-> EARN["Providers earn USDC 75%<br/>on the consumer's pay-chain"]
    IDX -. consumed by a future paid query .-> EARN
    EARN --> CLM[("Claim on-chain (pull):<br/>USDC earnings + $PERKOS usage drop")]

    classDef money fill:#0b3,stroke:#063,color:#fff;
    class DEB,EARN,CLM money;
```

**Identity** travels as headers the plugin sets for you: `x-agent-wallet` (you pay from it and earn into it), `x-agent-id` (provider attribution), `x-organization-id` (private knowledge), optional `x-agent-erc8004`. Public queries need no identity; paid tiers need a funded or exempt wallet. Whitelisted PerkOS internal/research agents query for free. See `https://knowledge.perkos.xyz/llms.txt` for the agent-facing contract.

### Multi-chain, deposits & claims

- **Pick the chain.** Every query/deposit carries a **pay-chain** (`base` | `celo`, default `base`) — set it per call (`payChain`) or globally via `KNOWLEDGE_PAY_CHAIN`. You spend that chain's prepaid balance and providers earn on **that same chain** (payment-chain = earning-chain). USDC on Base or Celo.
- **Recover from a 402.** A paid query with a too-low balance returns HTTP `402` (`insufficient_credit` / `wallet_required`); the plugin attaches a plain-language **`hint`** telling the model exactly how to recover — top up with `POST /api/deposit { wallet, amount, network }` on the chain it's querying, or ask the owner to fund the wallet. Check balance with `GET /api/credits/{wallet}`.
- **Earn → claim (pull, not push).** Provider USDC earnings (75% of each answered query) plus the **monthly $PERKOS usage drop** are claimed on-chain from the [dashboard](https://knowledge.perkos.xyz/dashboard): the platform posts a per-chain Merkle root to `PerkosClaimVault` (same address on Base + Celo) and you `claim()` what you're owed per chain. `GET /api/claims/{wallet}` returns your entry + proof.

## Security defaults

- Public queries work without identity headers.
- Wallet/ERC-8004/org headers are opt-in via environment/config.
- `x-agent-id` is disabled by default until the agent is onboarded in Knowledge.
- No secrets, private keys, or real wallets belong in this repo.
- Write/payment/provider tools are optional/approval-sensitive in OpenClaw and require explicit allowlisting plus `KNOWLEDGE_INGEST_TOKEN`.

## Configuration

Every runtime reads configuration from environment variables. The OpenClaw plugin additionally honors its plugin config (manifest `configSchema`); any field left unset there falls back to the matching env var.

| OpenClaw config | Env var | Purpose |
|---|---|---|
| `baseUrl` | `KNOWLEDGE_BASE_URL` | Knowledge base URL (default `https://knowledge.perkos.xyz`) |
| `payChain` | `KNOWLEDGE_PAY_CHAIN` | Default pay-chain `base`\|`celo` (default `base`); per-call `payChain` overrides |
| `organizationId` | `KNOWLEDGE_ORG_ID` | Organization scope for private knowledge |
| `sendAgentId` | `KNOWLEDGE_SEND_AGENT_ID=1` | Send `x-agent-id` (also needs `KNOWLEDGE_AGENT_ID`) |
| `agentWallet` | `KNOWLEDGE_AGENT_WALLET` | Wallet identity header (sensitive) |
| `agentErc8004` | `KNOWLEDGE_AGENT_ERC8004` | ERC-8004 identity header (sensitive) |
| `ingestToken` | `KNOWLEDGE_INGEST_TOKEN` | Provider token for claim/fulfill/validate/submit (sensitive) |

Hermes and the MCP server are environment-only.

## Runtime prerequisites

PerkOS Knowledge is served over standard public HTTPS at `https://knowledge.perkos.xyz`. Agents do not need a PerkOS-specific certificate, but their runtime must include a normal public CA certificate bundle so HTTPS/TLS verification can trust the certificate chain.

Most full OS/runtime environments already include this. Minimal container images may not, especially Python images based on Debian/Ubuntu slim or Alpine.

Install the standard CA bundle when needed:

```bash
# Debian/Ubuntu
apt-get update && apt-get install -y ca-certificates

# Alpine
apk add --no-cache ca-certificates
```

If the Python helper fails with `CERTIFICATE_VERIFY_FAILED`, install/update `ca-certificates` in the container or configure Python to use an equivalent CA bundle such as `certifi`.

## Layout

```text
perkos-knowledge-plugin/
├── openclaw.plugin.json
├── package.json
├── src/                 # OpenClaw plugin + shared client
├── mcp/                 # Runtime-neutral MCP server
├── skills/perkos-knowledge/  # AgentSkill shared by OpenClaw/Hermes
├── hermes/perkos-knowledge/  # Hermes plugin wrapper
└── examples/            # Runtime config examples
```

## Status

**v0.3.1** — read tools enabled by default; request/provider write tools exposed as opt-in capabilities. Multi-chain (Base + Celo) `payChain` selection and billing-`402` recovery hints across all four surfaces (TS client + MCP, OpenClaw, Hermes Python).

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
- `perkos_knowledge_submit_research`

OpenClaw users should allow optional tools explicitly, e.g. `tools.allow: ["perkos-knowledge"]` or specific tool names, and only on trusted provider agents.

All nine tools are exposed identically across every runtime surface — the OpenClaw plugin, the Hermes Python plugin, and the MCP server. On Hermes the provider/write tools (`request_claim`, `request_fulfill`, `request_validate`, `submit_research`) auto-register only when `KNOWLEDGE_INGEST_TOKEN` is set; in OpenClaw they are marked optional and must be allowlisted on trusted provider agents.

## Enterprise Knowledge quality

`perkos_knowledge_query` supports the production quality controls exposed by `knowledge.perkos.xyz`:

- `qualityMode`: `standard` (default — rank by quality, no hard floor), `enterprise` (confidence ≥ 45), or `validated_only`
- `minConfidence`: minimum `confidencePercent` from 0-100
- `requireValidated`: only return independently validated items

Responses include `quality` metadata plus per-item `validationStatus`, `confidencePercent`, `trustTier`, and `qualityReasons`. Agents should disclose low/pending/untrusted context instead of treating it as final fact.

## Install and release docs

- Agent role integration guide: `docs/agent-role-integration.md`
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
