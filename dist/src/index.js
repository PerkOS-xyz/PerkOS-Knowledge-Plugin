import { Type } from '@sinclair/typebox';
import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { PerkOsClient } from './client.js';
function text(payload) {
    return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        details: payload
    };
}
function record(params) {
    return (params && typeof params === 'object' ? params : {});
}
function stringArray(value) {
    return Array.isArray(value) ? value.map((entry) => String(entry)).filter(Boolean) : undefined;
}
function client() {
    return new PerkOsClient();
}
export default definePluginEntry({
    id: 'perkos-tech',
    name: 'PerkOS Tech',
    description: 'PerkOS Knowledge, x402, ERC-8004 identity, and organization-aware context tools.',
    register(api) {
        api.registerTool({
            name: 'perkos_skill_manifest',
            label: 'PerkOS skill manifest',
            description: 'Fetch the PerkOS Knowledge live skill manifest.',
            parameters: Type.Object({}),
            async execute() {
                return text(await client().manifest());
            }
        });
        api.registerTool({
            name: 'perkos_x402_policy',
            label: 'PerkOS x402 policy',
            description: 'Fetch current PerkOS Knowledge x402 metering/payment policy.',
            parameters: Type.Object({}),
            async execute() {
                return text(await client().x402Policy());
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
                missingTopics: Type.Optional(Type.Array(Type.String(), { description: 'Known missing topics for request creation.' }))
            }),
            async execute(_id, params) {
                const p = record(params);
                return text(await client().query({
                    query: String(p.query || ''),
                    limit: typeof p.limit === 'number' ? p.limit : undefined,
                    organizationId: typeof p.organizationId === 'string' ? p.organizationId : undefined,
                    createRequestOnMiss: typeof p.createRequestOnMiss === 'boolean' ? p.createRequestOnMiss : undefined,
                    desiredOutput: typeof p.desiredOutput === 'string' ? p.desiredOutput : undefined,
                    missingTopics: stringArray(p.missingTopics)
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
                return text(await client().listRequests({
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
                return text(await client().createRequest({
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
                return text(await client().claimRequest({ requestId: String(p.requestId || ''), notes: typeof p.notes === 'string' ? p.notes : undefined }));
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
                return text(await client().fulfillRequest({
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
                return text(await client().validateRequest({
                    requestId: String(p.requestId || ''),
                    accepted: typeof p.accepted === 'boolean' ? p.accepted : undefined,
                    validationNotes: typeof p.validationNotes === 'string' ? p.validationNotes : undefined
                }));
            }
        }, { optional: true });
    }
});
