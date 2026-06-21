import { Type } from 'typebox';
import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { PerkOsClient } from './client.js';

function text(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
    details: payload
  };
}

function record(params: unknown) {
  return (params && typeof params === 'object' ? params : {}) as Record<string, unknown>;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((entry) => String(entry)).filter(Boolean) : undefined;
}

export default definePluginEntry({
  id: 'perkos-tech',
  name: 'PerkOS Tech',
  description: 'PerkOS Knowledge, x402, ERC-8004 identity, and organization-aware context tools.',
  register(api) {
    // Prefer OpenClaw plugin config (manifest configSchema); PerkOsClient falls
    // back to env vars for any field left unset. Built once — session-stable.
    const cfg = ((): Record<string, unknown> => {
      const c = (api as { pluginConfig?: unknown }).pluginConfig;
      return c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
    })();
    const knowledge = new PerkOsClient({
      baseUrl: typeof cfg.baseUrl === 'string' ? cfg.baseUrl : undefined,
      organizationId: typeof cfg.organizationId === 'string' ? cfg.organizationId : undefined,
      sendAgentId: typeof cfg.sendAgentId === 'boolean' ? cfg.sendAgentId : undefined,
      agentWallet: typeof cfg.agentWallet === 'string' ? cfg.agentWallet : undefined,
      agentErc8004: typeof cfg.agentErc8004 === 'string' ? cfg.agentErc8004 : undefined,
      ingestToken: typeof cfg.ingestToken === 'string' ? cfg.ingestToken : undefined,
    });
    api.registerTool({
      name: 'perkos_skill_manifest',
      label: 'PerkOS skill manifest',
      description: 'Fetch the PerkOS Knowledge live skill manifest.',
      parameters: Type.Object({}),
      async execute() {
        return text(await knowledge.manifest());
      }
    });

    api.registerTool({
      name: 'perkos_x402_policy',
      label: 'PerkOS x402 policy',
      description: 'Fetch current PerkOS Knowledge x402 metering/payment policy.',
      parameters: Type.Object({}),
      async execute() {
        return text(await knowledge.x402Policy());
      }
    });

    api.registerTool({
      name: 'perkos_knowledge_query',
      label: 'PerkOS Knowledge query',
      description: 'Query PerkOS Knowledge for public or organization-scoped context. Can auto-create a knowledge request when coverage is insufficient.',
      parameters: Type.Object({
        query: Type.String({ description: 'Knowledge query text.' }),
        limit: Type.Optional(Type.Number({ description: 'Maximum number of context items.', default: 5 })),
        organizationId: Type.Optional(Type.String({ description: 'Optional organization scope for private knowledge.' })),
        createRequestOnMiss: Type.Optional(Type.Boolean({ description: 'Create a Knowledge request when coverage is insufficient.', default: true })),
        desiredOutput: Type.Optional(Type.String({ description: 'Desired output type for auto-created request, e.g. brief, report, skill.' })),
        missingTopics: Type.Optional(Type.Array(Type.String(), { description: 'Known missing topics for request creation.' })),
        qualityMode: Type.Optional(Type.String({ description: 'Quality policy: enterprise (default) or validated_only.' })),
        minConfidence: Type.Optional(Type.Number({ description: 'Minimum confidencePercent 0-100. Enterprise default on server is 45.' })),
        requireValidated: Type.Optional(Type.Boolean({ description: 'Only return independently validated Knowledge items.' }))
      }),
      async execute(_id, params) {
        const p = record(params);
        return text(await knowledge.query({
          query: String(p.query || ''),
          limit: typeof p.limit === 'number' ? p.limit : undefined,
          organizationId: typeof p.organizationId === 'string' ? p.organizationId : undefined,
          createRequestOnMiss: typeof p.createRequestOnMiss === 'boolean' ? p.createRequestOnMiss : undefined,
          desiredOutput: typeof p.desiredOutput === 'string' ? p.desiredOutput : undefined,
          missingTopics: stringArray(p.missingTopics),
          qualityMode: typeof p.qualityMode === 'string' ? p.qualityMode : undefined,
          minConfidence: typeof p.minConfidence === 'number' ? p.minConfidence : undefined,
          requireValidated: typeof p.requireValidated === 'boolean' ? p.requireValidated : undefined
        }));
      }
    });

    api.registerTool({
      name: 'perkos_knowledge_requests_list',
      label: 'List PerkOS Knowledge requests',
      description: 'List Knowledge research requests by status for provider or consumer agents.',
      parameters: Type.Object({
        status: Type.Optional(Type.String({ description: 'Request status: open, claimed, fulfilled, validated, closed, rejected, or all.', default: 'open' })),
        limit: Type.Optional(Type.Number({ description: 'Maximum requests to return.', default: 25 }))
      }),
      async execute(_id, params) {
        const p = record(params);
        return text(await knowledge.listRequests({
          status: typeof p.status === 'string' ? p.status : undefined,
          limit: typeof p.limit === 'number' ? p.limit : undefined
        }));
      }
    });

    api.registerTool({
      name: 'perkos_knowledge_request_create',
      label: 'Create PerkOS Knowledge request',
      description: 'Create a research/skill request when PerkOS Knowledge lacks coverage.',
      parameters: Type.Object({
        query: Type.String({ description: 'Requested research question or missing knowledge topic.' }),
        priority: Type.Optional(Type.String({ description: 'low, normal, high, or urgent.' })),
        desiredOutput: Type.Optional(Type.String({ description: 'brief, report, dataset, skill, code example, etc.' })),
        missingTopics: Type.Optional(Type.Array(Type.String())),
        notes: Type.Optional(Type.String()),
        allowDuplicate: Type.Optional(Type.Boolean({ default: false }))
      }),
      async execute(_id, params) {
        const p = record(params);
        return text(await knowledge.createRequest({
          query: String(p.query || ''),
          priority: typeof p.priority === 'string' ? p.priority : undefined,
          desiredOutput: typeof p.desiredOutput === 'string' ? p.desiredOutput : undefined,
          missingTopics: stringArray(p.missingTopics),
          notes: typeof p.notes === 'string' ? p.notes : undefined,
          allowDuplicate: typeof p.allowDuplicate === 'boolean' ? p.allowDuplicate : undefined
        }));
      }
    }, { optional: true });

    api.registerTool({
      name: 'perkos_knowledge_request_claim',
      label: 'Claim PerkOS Knowledge request',
      description: 'Claim an open Knowledge request as an onboarded provider agent. Requires KNOWLEDGE_INGEST_TOKEN and provider identity env/config.',
      parameters: Type.Object({
        requestId: Type.String(),
        notes: Type.Optional(Type.String())
      }),
      async execute(_id, params) {
        const p = record(params);
        return text(await knowledge.claimRequest({ requestId: String(p.requestId || ''), notes: typeof p.notes === 'string' ? p.notes : undefined }));
      }
    }, { optional: true });

    api.registerTool({
      name: 'perkos_knowledge_request_fulfill',
      label: 'Fulfill PerkOS Knowledge request',
      description: 'Mark a Knowledge request fulfilled with research item IDs. Requires KNOWLEDGE_INGEST_TOKEN and provider identity env/config.',
      parameters: Type.Object({
        requestId: Type.String(),
        researchItemIds: Type.Array(Type.String()),
        notes: Type.Optional(Type.String())
      }),
      async execute(_id, params) {
        const p = record(params);
        return text(await knowledge.fulfillRequest({
          requestId: String(p.requestId || ''),
          researchItemIds: stringArray(p.researchItemIds),
          notes: typeof p.notes === 'string' ? p.notes : undefined
        }));
      }
    }, { optional: true });

    api.registerTool({
      name: 'perkos_knowledge_request_validate',
      label: 'Validate PerkOS Knowledge request',
      description: 'Validate or reject a fulfilled Knowledge request. Requires KNOWLEDGE_INGEST_TOKEN and validator/provider identity env/config.',
      parameters: Type.Object({
        requestId: Type.String(),
        accepted: Type.Optional(Type.Boolean({ default: true })),
        validationNotes: Type.Optional(Type.String())
      }),
      async execute(_id, params) {
        const p = record(params);
        return text(await knowledge.validateRequest({
          requestId: String(p.requestId || ''),
          accepted: typeof p.accepted === 'boolean' ? p.accepted : undefined,
          validationNotes: typeof p.validationNotes === 'string' ? p.validationNotes : undefined
        }));
      }
    }, { optional: true });

    api.registerTool({
      name: 'perkos_knowledge_submit_research',
      label: 'Submit PerkOS Knowledge research',
      description: 'Submit sanitized research/provider contributions to PerkOS Knowledge. Requires KNOWLEDGE_INGEST_TOKEN and onboarded provider identity.',
      parameters: Type.Object({
        source: Type.Optional(Type.String({ description: 'Provider/source name for provenance.' })),
        visibility: Type.Optional(Type.String({ description: 'private, public_candidate, or public.', default: 'private' })),
        organizationId: Type.Optional(Type.String({ description: 'Organization scope for private/provider knowledge.' })),
        contributionType: Type.Optional(Type.String({ description: 'research, market_signal, technical_note, news_digest, or custom.' })),
        items: Type.Array(Type.Object({
          path: Type.String({ description: 'Stable provider path/id for idempotent upserts.' }),
          title: Type.Optional(Type.String()),
          summary: Type.Optional(Type.String()),
          content: Type.Optional(Type.String()),
          track: Type.Optional(Type.String()),
          chains: Type.Optional(Type.Array(Type.String())),
          agents: Type.Optional(Type.Array(Type.String())),
          confidence: Type.Optional(Type.String()),
          visibility: Type.Optional(Type.String()),
          contributionType: Type.Optional(Type.String()),
          evidence: Type.Optional(Type.Array(Type.Any())),
          metadata: Type.Optional(Type.Record(Type.String(), Type.Any()))
        }), { minItems: 1 })
      }),
      async execute(_id, params) {
        const p = record(params);
        const items = Array.isArray(p.items) ? p.items.map((item) => record(item)) : [];
        return text(await knowledge.submitResearch({
          source: typeof p.source === 'string' ? p.source : undefined,
          visibility: typeof p.visibility === 'string' ? p.visibility : undefined,
          organizationId: typeof p.organizationId === 'string' ? p.organizationId : undefined,
          contributionType: typeof p.contributionType === 'string' ? p.contributionType : undefined,
          items: items.map((item) => ({
            path: String(item.path || ''),
            title: typeof item.title === 'string' ? item.title : undefined,
            summary: typeof item.summary === 'string' ? item.summary : undefined,
            content: typeof item.content === 'string' ? item.content : undefined,
            track: typeof item.track === 'string' ? item.track : undefined,
            chains: stringArray(item.chains),
            agents: stringArray(item.agents),
            confidence: typeof item.confidence === 'string' ? item.confidence : undefined,
            visibility: typeof item.visibility === 'string' ? item.visibility : undefined,
            contributionType: typeof item.contributionType === 'string' ? item.contributionType : undefined,
            evidence: Array.isArray(item.evidence) ? item.evidence : undefined,
            metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata as Record<string, unknown> : undefined
          }))
        }));
      }
    }, { optional: true });
  }
});
