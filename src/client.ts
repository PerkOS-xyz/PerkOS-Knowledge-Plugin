export type PerkOsClientOptions = {
  baseUrl?: string;
  organizationId?: string;
  agentWallet?: string;
  agentErc8004?: string;
  agentId?: string;
  sendAgentId?: boolean;
};

export type KnowledgeQueryParams = {
  query: string;
  limit?: number;
  organizationId?: string;
};

export class PerkOsClient {
  private readonly baseUrl: string;
  private readonly options: PerkOsClientOptions;

  constructor(options: PerkOsClientOptions = {}) {
    this.baseUrl = (options.baseUrl || process.env.KNOWLEDGE_BASE_URL || 'https://knowledge.perkos.xyz').replace(/\/$/, '');
    this.options = options;
  }

  private headers(extra?: { organizationId?: string }): Record<string, string> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    const orgId = extra?.organizationId || this.options.organizationId || process.env.KNOWLEDGE_ORG_ID;
    const wallet = this.options.agentWallet || process.env.KNOWLEDGE_AGENT_WALLET;
    const erc8004 = this.options.agentErc8004 || process.env.KNOWLEDGE_AGENT_ERC8004;
    const agentId = this.options.agentId || process.env.KNOWLEDGE_AGENT_ID;

    if (orgId) headers['x-organization-id'] = orgId;
    if (wallet) headers['x-agent-wallet'] = wallet;
    if (erc8004) headers['x-agent-erc8004'] = erc8004;
    if ((this.options.sendAgentId || process.env.KNOWLEDGE_SEND_AGENT_ID === '1') && agentId) {
      headers['x-agent-id'] = agentId;
    }
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
      limit: params.limit ?? 5
    }, { organizationId: params.organizationId });
  }

  private async request(method: string, path: string, body?: unknown, extra?: { organizationId?: string }): Promise<unknown> {
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
