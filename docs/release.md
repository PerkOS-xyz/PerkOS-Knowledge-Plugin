# Release Checklist

This package ships OpenClaw, MCP, Hermes, and AgentSkill surfaces. Release only after all surfaces pass checks.

## Preflight

```bash
git checkout main
git pull --ff-only origin main
npm ci
npm run check
npm run build
npm run py:check
npm run smoke
npm run pack:dry-run
```

Confirm `npm pack --dry-run` includes at least:

- `dist/`
- `openclaw.plugin.json`
- `skills/`
- `hermes/`
- `examples/`
- `examples/hermes-agent.config.yaml`
- `docs/`
- `README.md`
- `LICENSE`

Confirm it does **not** include:

- `.env`
- secret files
- local workspace files
- `node_modules/`
- Python `__pycache__/`

## Versioning

Use semver:

- Patch: docs, examples, non-breaking fixes.
- Minor: new tools/endpoints/backward-compatible runtime support.
- Major: tool schema or behavior changes that may break agents.

Update these together:

- `package.json` version
- `package-lock.json` version
- `openclaw.plugin.json` version
- `hermes/perkos-tech/plugin.yaml` version
- `mcp/server.ts` server version

Then rebuild so `dist/` matches source.

## Publish candidate PR

All changes should land through PR. Do not merge directly to `main`.

Recommended PR body:

```markdown
## Summary
- Version bump to x.y.z
- Built dist artifacts
- Updated release notes

## Checks
- npm run check
- npm run build
- npm run py:check
- npm run smoke
- npm run pack:dry-run
```

## GitHub release/tag

After the release PR is merged:

```bash
git checkout main
git pull --ff-only origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

Create a GitHub release from the tag with short notes and compatibility notes.

## npm publish

Only publish from clean `main` after tag creation and package-content review:

```bash
npm whoami
npm pack --dry-run
npm publish --access public
```

If npm organization access is not configured, stop and ask the package owner/admin to grant publish permissions for `@perkos`.

## Post-release smoke

From a temporary directory:

```bash
npm init -y
npm install @perkos/perkos-knowledge-plugin@X.Y.Z
node -e "import('@perkos/perkos-knowledge-plugin').then(m => console.log(Object.keys(m)))"
npx perkos-tech-mcp --help || true
```

Then test one live Knowledge read call from OpenClaw/Hermes/MCP before enabling provider write tools on production agents.

For real Hermes Agent releases, additionally verify against `nousresearch/hermes-agent` or an equivalent Hermes install:

```bash
hermes plugins list | grep perkos-tech
hermes tools list | grep -i perkos
python3 /opt/data/skills/perkos/perkos-tech/scripts/perkos_tech.py manifest
python3 /opt/data/skills/perkos/perkos-tech/scripts/perkos_tech.py requests --limit 1
```

If using the PerkOS LLM proxy, verify the custom provider uses `api_mode: chat_completions` and that Hermes `/v1/responses` returns a simple test reply.
