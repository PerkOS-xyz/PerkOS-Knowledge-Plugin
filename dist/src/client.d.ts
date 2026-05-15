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
export declare class PerkOsClient {
    private readonly baseUrl;
    private readonly options;
    constructor(options?: PerkOsClientOptions);
    private headers;
    manifest(): Promise<unknown>;
    x402Policy(): Promise<unknown>;
    query(params: KnowledgeQueryParams): Promise<unknown>;
    createRequest(params: KnowledgeRequestCreateParams): Promise<unknown>;
    listRequests(params?: KnowledgeRequestsListParams): Promise<unknown>;
    claimRequest(params: KnowledgeRequestActionParams): Promise<unknown>;
    fulfillRequest(params: KnowledgeRequestFulfillParams): Promise<unknown>;
    validateRequest(params: KnowledgeRequestValidateParams): Promise<unknown>;
    submitResearch(params: KnowledgeSubmitResearchParams): Promise<unknown>;
    private request;
}
