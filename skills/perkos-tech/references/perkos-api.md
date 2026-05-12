# PerkOS API Reference

Base URL: `https://knowledge.perkos.xyz`

Endpoints:

- `GET /skill/manifest`
- `POST /skill/query`
- `GET /api/x402/policy`
- `GET/POST /knowledge/search`
- `GET/POST /knowledge/vector-search`

Headers:

- `x-agent-wallet`
- `x-agent-erc8004`
- `x-organization-id`
- `x-agent-id` — only after onboarding.

Query body:

```json
{
  "query": "question",
  "limit": 5
}
```
