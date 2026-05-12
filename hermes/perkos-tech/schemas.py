PERKOS_KNOWLEDGE_QUERY = {
    "name": "perkos_knowledge_query",
    "description": "Query PerkOS Knowledge for public or organization-scoped context.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Knowledge query text."},
            "limit": {"type": "number", "description": "Maximum context items."},
            "organizationId": {"type": "string", "description": "Optional organization scope."},
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
