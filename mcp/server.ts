import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { PerkOsClient } from '../src/client.js';

const server = new McpServer({ name: 'perkos-tech', version: '0.2.0' });
const client = new PerkOsClient();

server.tool('skill_manifest', 'Fetch the PerkOS Knowledge live skill manifest.', {}, async () => ({
  content: [{ type: 'text', text: JSON.stringify(await client.manifest(), null, 2) }]
}));

server.tool('x402_policy', 'Fetch current PerkOS Knowledge x402 metering/payment policy.', {}, async () => ({
  content: [{ type: 'text', text: JSON.stringify(await client.x402Policy(), null, 2) }]
}));

server.tool('knowledge_query', 'Query PerkOS Knowledge for public or organization-scoped context. Can auto-create requests on insufficient coverage.', {
  query: z.string(),
  limit: z.number().optional(),
  organizationId: z.string().optional(),
  createRequestOnMiss: z.boolean().optional(),
  desiredOutput: z.string().optional(),
  missingTopics: z.array(z.string()).optional()
}, async (args) => ({
  content: [{ type: 'text', text: JSON.stringify(await client.query(args), null, 2) }]
}));

server.tool('knowledge_requests_list', 'List PerkOS Knowledge requests by status.', {
  status: z.string().optional(),
  limit: z.number().optional()
}, async (args) => ({
  content: [{ type: 'text', text: JSON.stringify(await client.listRequests(args), null, 2) }]
}));

server.tool('knowledge_request_create', 'Create a PerkOS Knowledge request when knowledge coverage is missing.', {
  query: z.string(),
  priority: z.string().optional(),
  desiredOutput: z.string().optional(),
  missingTopics: z.array(z.string()).optional(),
  notes: z.string().optional(),
  allowDuplicate: z.boolean().optional()
}, async (args) => ({
  content: [{ type: 'text', text: JSON.stringify(await client.createRequest(args), null, 2) }]
}));

server.tool('knowledge_request_claim', 'Claim a PerkOS Knowledge request as an onboarded provider agent.', {
  requestId: z.string(),
  notes: z.string().optional()
}, async (args) => ({
  content: [{ type: 'text', text: JSON.stringify(await client.claimRequest(args), null, 2) }]
}));

server.tool('knowledge_request_fulfill', 'Mark a PerkOS Knowledge request fulfilled with accepted research item IDs.', {
  requestId: z.string(),
  researchItemIds: z.array(z.string()),
  notes: z.string().optional()
}, async (args) => ({
  content: [{ type: 'text', text: JSON.stringify(await client.fulfillRequest(args), null, 2) }]
}));

server.tool('knowledge_request_validate', 'Validate or reject a fulfilled PerkOS Knowledge request.', {
  requestId: z.string(),
  accepted: z.boolean().optional(),
  validationNotes: z.string().optional()
}, async (args) => ({
  content: [{ type: 'text', text: JSON.stringify(await client.validateRequest(args), null, 2) }]
}));

await server.connect(new StdioServerTransport());
