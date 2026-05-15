export type PerkOsClientOptions = {
  baseUrl?: string;
  organizationId?: string;
  agentWallet?: string;
  agentErc8004?: string;
  agentId?: string;
  sendAgentId?: boolean;
  ingestToken?: string;
};

export type KnowledgeQueryParams = {
  query: string;
  limit?: number;
  organizationId?: string;
  createRequestOnMiss?: boolean;
  desiredOutput?: string;
  missingTopics?: string[];
  qualityMode?: 'enterprise' | 'validated_only' | string;
  minConfidence?: number;
  requireValidated?: boolean;
};

export type KnowledgeRequestCreateParams = {
  query: string;
  priority?: string;
  desiredOutput?: string;
  missingTopics?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  allowDuplicate?: boolean;
};

export type KnowledgeRequestsListParams = {
  status?: 'open' | 'claimed' | 'fulfilled' | 'validated' | 'closed' | 'rejected' | 'all' | string;
  limit?: number;
};

export type KnowledgeRequestActionParams = {
  requestId: string;
  notes?: string;
};

export type KnowledgeRequestFulfillParams = KnowledgeRequestActionParams & {
  researchItemIds?: string[];
};

export type KnowledgeRequestValidateParams = KnowledgeRequestActionParams & {
  accepted?: boolean;
  validationNotes?: string;
};

export type KnowledgeContributionItem = {
  path: string;
  title?: string;
  summary?: string;
  content?: string;
  track?: string;
  chains?: string[];
  agents?: string[];
  confidence?: string;
  visibility?: 'private' | 'public_candidate' | 'public' | string;
  contributionType?: string;
  evidence?: unknown[];
  metadata?: Record<string, unknown>;
};

export type KnowledgeSubmitResearchParams = {
  source?: string;
  visibility?: 'private' | 'public_candidate' | 'public' | string;
  organizationId?: string;
  contributionType?: string;
  items: KnowledgeContributionItem[];
};

export class PerkOsClient {
  private readonly baseUrl: string;
  private readonly options: PerkOsClientOptions;

  constructor(options: PerkOsClientOptions = {}) {
    this.baseUrl = (options.baseUrl || process.env.KNOWLEDGE_BASE_URL || 'https://knowledge.perkos.xyz').replace(/\/$/, '');
    this.options = options;
  }

  private headers(extra?: { organizationId?: string; auth?: boolean }): Record<string, string> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const orgId = extra?.organizationId || this.options.organizationId || process.env.KNOWLEDGE_ORG_ID;
    const wallet = this.options.agentWallet || process.env.KNOWLEDGE_AGENT_WALLET;
    const erc8004 = this.options.agentErc8004 || process.env.KNOWLEDGE_AGENT_ERC8004;
    const agentId = this.options.agentId || process.env.KNOWLEDGE_AGENT_ID;
    const token = this.options.ingestToken || process.env.KNOWLEDGE_INGEST_TOKEN;

    if (orgId) headers['x-organization-id'] = orgId;
    if (wallet) headers['x-agent-wallet'] = wallet;
    if (erc8004) headers['x-agent-erc8004'] = erc8004;
    if ((this.options.sendAgentId || process.env.KNOWLEDGE_SEND_AGENT_ID === '1') && agentId) {
      headers['x-agent-id'] = agentId;
    }
    if (extra?.auth && token) headers.authorization = `Bearer ${token}`;
    return headers;
  }

  async manifest(): Promise<unknown> {
    return this.request('GET', '/skill/manifest');
  }

  async x402Policy(): Promise<unknown> {
    return this.request('GET', '/api/x402/policy');
  }

  async query(params: KnowledgeQueryParams): Promise<unknown> {
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

  async createRequest(params: KnowledgeRequestCreateParams): Promise<unknown> {
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

  async listRequests(params: KnowledgeRequestsListParams = {}): Promise<unknown> {
    const status = encodeURIComponent(params.status || 'open');
    const limit = encodeURIComponent(String(params.limit ?? 25));
    return this.request('GET', `/knowledge/requests?status=${status}&limit=${limit}`);
  }

  async claimRequest(params: KnowledgeRequestActionParams): Promise<unknown> {
    return this.request('POST', `/knowledge/requests/${encodeURIComponent(params.requestId)}/claim`, {
      notes: params.notes
    }, { auth: true });
  }

  async fulfillRequest(params: KnowledgeRequestFulfillParams): Promise<unknown> {
    return this.request('POST', `/knowledge/requests/${encodeURIComponent(params.requestId)}/fulfill`, {
      research_item_ids: params.researchItemIds || [],
      notes: params.notes
    }, { auth: true });
  }

  async validateRequest(params: KnowledgeRequestValidateParams): Promise<unknown> {
    return this.request('POST', `/knowledge/requests/${encodeURIComponent(params.requestId)}/validate`, {
      accepted: params.accepted !== false,
      validation_notes: params.validationNotes || params.notes
    }, { auth: true });
  }

  async submitResearch(params: KnowledgeSubmitResearchParams): Promise<unknown> {
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

  private async request(method: string, path: string, body?: unknown, extra?: { organizationId?: string; auth?: boolean }): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(extra),
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await res.text();
    let payload: unknown;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { raw: text };
    }
    if (!res.ok) {
      return { ok: false, status: res.status, response: payload };
    }
    return payload;
  }
}
