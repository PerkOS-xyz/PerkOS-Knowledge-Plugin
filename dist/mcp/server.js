import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { PerkOsClient } from '../src/client.js';
const server = new McpServer({ name: 'perkos-tech', version: '0.1.0' });
const client = new PerkOsClient();
server.tool('skill_manifest', 'Fetch the PerkOS Knowledge live skill manifest.', {}, async () => ({
    content: [{ type: 'text', text: JSON.stringify(await client.manifest(), null, 2) }]
}));
server.tool('x402_policy', 'Fetch current PerkOS Knowledge x402 metering/payment policy.', {}, async () => ({
    content: [{ type: 'text', text: JSON.stringify(await client.x402Policy(), null, 2) }]
}));
server.tool('knowledge_query', 'Query PerkOS Knowledge for public or organization-scoped context.', {
    query: z.string(),
    limit: z.number().optional(),
    organizationId: z.string().optional()
}, async (args) => ({
    content: [{ type: 'text', text: JSON.stringify(await client.query(args), null, 2) }]
}));
await server.connect(new StdioServerTransport());
