export class PerkOsClient {
    baseUrl;
    options;
    constructor(options = {}) {
        this.baseUrl = (options.baseUrl || process.env.KNOWLEDGE_BASE_URL || 'https://knowledge.perkos.xyz').replace(/\/$/, '');
        this.options = options;
    }
    headers(extra) {
        const headers = { 'content-type': 'application/json' };
        const orgId = extra?.organizationId || this.options.organizationId || process.env.KNOWLEDGE_ORG_ID;
        const wallet = this.options.agentWallet || process.env.KNOWLEDGE_AGENT_WALLET;
        const erc8004 = this.options.agentErc8004 || process.env.KNOWLEDGE_AGENT_ERC8004;
        const agentId = this.options.agentId || process.env.KNOWLEDGE_AGENT_ID;
        const token = this.options.ingestToken || process.env.KNOWLEDGE_INGEST_TOKEN;
        if (orgId)
            headers['x-organization-id'] = orgId;
        if (wallet)
            headers['x-agent-wallet'] = wallet;
        if (erc8004)
            headers['x-agent-erc8004'] = erc8004;
        if ((this.options.sendAgentId || process.env.KNOWLEDGE_SEND_AGENT_ID === '1') && agentId) {
            headers['x-agent-id'] = agentId;
        }
        if (extra?.auth && token)
            headers.authorization = `Bearer ${token}`;
        return headers;
    }
    async manifest() {
        return this.request('GET', '/skill/manifest');
    }
    async x402Policy() {
        return this.request('GET', '/api/x402/policy');
    }
    async query(params) {
        return this.request('POST', '/skill/query', {
            query: params.query,
            limit: params.limit ?? 5,
            createRequestOnMiss: params.createRequestOnMiss,
            desired_output: params.desiredOutput,
            missing_topics: params.missingTopics,
            qualityMode: params.qualityMode,
            minConfidence: params.minConfidence,
            requireValidated: params.requireValidated
        }, { organizationId: params.organizationId });
    }
    async createRequest(params) {
        return this.request('POST', '/knowledge/requests', {
            query: params.query,
            priority: params.priority,
            desired_output: params.desiredOutput,
            missing_topics: params.missingTopics,
            notes: params.notes,
            metadata: params.metadata,
            allow_duplicate: params.allowDuplicate
        });
    }
    async listRequests(params = {}) {
        const status = encodeURIComponent(params.status || 'open');
        const limit = encodeURIComponent(String(params.limit ?? 25));
        return this.request('GET', `/knowledge/requests?status=${status}&limit=${limit}`);
    }
    async claimRequest(params) {
        return this.request('POST', `/knowledge/requests/${encodeURIComponent(params.requestId)}/claim`, {
            notes: params.notes
        }, { auth: true });
    }
    async fulfillRequest(params) {
        return this.request('POST', `/knowledge/requests/${encodeURIComponent(params.requestId)}/fulfill`, {
            research_item_ids: params.researchItemIds || [],
            notes: params.notes
        }, { auth: true });
    }
    async validateRequest(params) {
        return this.request('POST', `/knowledge/requests/${encodeURIComponent(params.requestId)}/validate`, {
            accepted: params.accepted !== false,
            validation_notes: params.validationNotes || params.notes
        }, { auth: true });
    }
    async submitResearch(params) {
        return this.request('POST', '/api/ingest/research', {
            source: params.source,
            visibility: params.visibility,
            organization_id: params.organizationId,
            contribution_type: params.contributionType,
            items: params.items.map((item) => ({
                ...item,
                contribution_type: item.contributionType || params.contributionType
            }))
        }, { organizationId: params.organizationId, auth: true });
    }
    async request(method, path, body, extra) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: this.headers(extra),
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const text = await res.text();
        let payload;
        try {
            payload = text ? JSON.parse(text) : null;
        }
        catch {
            payload = { raw: text };
        }
        if (!res.ok) {
            return { ok: false, status: res.status, response: payload };
        }
        return payload;
    }
}
