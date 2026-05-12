import { Type } from '@sinclair/typebox';
import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { PerkOsClient } from './client.js';
function text(payload) {
    return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        details: payload
    };
}
function queryParams(params) {
    const record = (params && typeof params === 'object' ? params : {});
    return {
        query: String(record.query || ''),
        limit: typeof record.limit === 'number' ? record.limit : undefined,
        organizationId: typeof record.organizationId === 'string' ? record.organizationId : undefined
    };
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
                return text(await new PerkOsClient().manifest());
            }
        });
        api.registerTool({
            name: 'perkos_x402_policy',
            label: 'PerkOS x402 policy',
            description: 'Fetch current PerkOS Knowledge x402 metering/payment policy.',
            parameters: Type.Object({}),
            async execute() {
                return text(await new PerkOsClient().x402Policy());
            }
        });
        api.registerTool({
            name: 'perkos_knowledge_query',
            label: 'PerkOS Knowledge query',
            description: 'Query PerkOS Knowledge for public or organization-scoped context. Use before answering PerkOS operational, architecture, x402, ERC-8004, or council questions.',
            parameters: Type.Object({
                query: Type.String({ description: 'Knowledge query text.' }),
                limit: Type.Optional(Type.Number({ description: 'Maximum number of context items.', default: 5 })),
                organizationId: Type.Optional(Type.String({ description: 'Optional organization scope for private knowledge.' }))
            }),
            async execute(_id, params) {
                return text(await new PerkOsClient().query(queryParams(params)));
            }
        });
    }
});
