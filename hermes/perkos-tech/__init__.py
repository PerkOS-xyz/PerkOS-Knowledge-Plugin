from . import schemas, tools


def register(ctx):
    ctx.register_tool(
        name="perkos_knowledge_query",
        toolset="perkos-tech",
        schema=schemas.PERKOS_KNOWLEDGE_QUERY,
        handler=tools.perkos_knowledge_query,
    )
    ctx.register_tool(
        name="perkos_skill_manifest",
        toolset="perkos-tech",
        schema=schemas.PERKOS_SKILL_MANIFEST,
        handler=tools.perkos_skill_manifest,
    )
    ctx.register_tool(
        name="perkos_x402_policy",
        toolset="perkos-tech",
        schema=schemas.PERKOS_X402_POLICY,
        handler=tools.perkos_x402_policy,
    )
