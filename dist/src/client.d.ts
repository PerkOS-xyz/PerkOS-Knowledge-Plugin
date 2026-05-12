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
export declare class PerkOsClient {
    private readonly baseUrl;
    private readonly options;
    constructor(options?: PerkOsClientOptions);
    private headers;
    manifest(): Promise<unknown>;
    x402Policy(): Promise<unknown>;
    query(params: KnowledgeQueryParams): Promise<unknown>;
    private request;
}
