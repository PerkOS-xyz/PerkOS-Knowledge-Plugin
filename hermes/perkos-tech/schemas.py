PERKOS_KNOWLEDGE_QUERY = {
    "name": "perkos_knowledge_query",
    "description": "Query PerkOS Knowledge for public or organization-scoped context. Can auto-create requests on insufficient coverage.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Knowledge query text."},
            "limit": {"type": "number", "description": "Maximum context items."},
            "organizationId": {"type": "string", "description": "Optional organization scope."},
            "createRequestOnMiss": {"type": "boolean", "description": "Create request when coverage is insufficient."},
            "desiredOutput": {"type": "string", "description": "Desired output for auto-created request."},
            "missingTopics": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["query"],
    },
}

PERKOS_SKILL_MANIFEST = {
    "name": "perkos_skill_manifest",
    "description": "Fetch the PerkOS Knowledge live skill manifest.",
    "parameters": {"type": "object", "properties": {}},
}

PERKOS_X402_POLICY = {
    "name": "perkos_x402_policy",
    "description": "Fetch current PerkOS Knowledge x402 metering/payment policy.",
    "parameters": {"type": "object", "properties": {}},
}

PERKOS_KNOWLEDGE_REQUESTS_LIST = {
    "name": "perkos_knowledge_requests_list",
    "description": "List PerkOS Knowledge requests by status.",
    "parameters": {
        "type": "object",
        "properties": {
            "status": {"type": "string", "description": "open, claimed, fulfilled, validated, closed, rejected, or all."},
            "limit": {"type": "number"},
        },
    },
}

PERKOS_KNOWLEDGE_REQUEST_CREATE = {
    "name": "perkos_knowledge_request_create",
    "description": "Create a PerkOS Knowledge request when knowledge coverage is missing.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "priority": {"type": "string"},
            "desiredOutput": {"type": "string"},
            "missingTopics": {"type": "array", "items": {"type": "string"}},
            "notes": {"type": "string"},
            "allowDuplicate": {"type": "boolean"},
        },
        "required": ["query"],
    },
}

PERKOS_KNOWLEDGE_REQUEST_CLAIM = {
    "name": "perkos_knowledge_request_claim",
    "description": "Claim a PerkOS Knowledge request as an onboarded provider agent.",
    "parameters": {
        "type": "object",
        "properties": {
            "requestId": {"type": "string"},
            "notes": {"type": "string"},
        },
        "required": ["requestId"],
    },
}

PERKOS_KNOWLEDGE_REQUEST_FULFILL = {
    "name": "perkos_knowledge_request_fulfill",
    "description": "Mark a PerkOS Knowledge request fulfilled with accepted research item IDs.",
    "parameters": {
        "type": "object",
        "properties": {
            "requestId": {"type": "string"},
            "researchItemIds": {"type": "array", "items": {"type": "string"}},
            "notes": {"type": "string"},
        },
        "required": ["requestId", "researchItemIds"],
    },
}

PERKOS_KNOWLEDGE_REQUEST_VALIDATE = {
    "name": "perkos_knowledge_request_validate",
    "description": "Validate or reject a fulfilled PerkOS Knowledge request.",
    "parameters": {
        "type": "object",
        "properties": {
            "requestId": {"type": "string"},
            "accepted": {"type": "boolean"},
            "validationNotes": {"type": "string"},
        },
        "required": ["requestId"],
    },
}
