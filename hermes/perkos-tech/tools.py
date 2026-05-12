import json
import os
import urllib.error
import urllib.request

BASE_URL = os.environ.get("KNOWLEDGE_BASE_URL", "https://knowledge.perkos.xyz").rstrip("/")


def _headers(org_id=None):
    headers = {"content-type": "application/json"}
    if org_id or os.environ.get("KNOWLEDGE_ORG_ID"):
        headers["x-organization-id"] = org_id or os.environ["KNOWLEDGE_ORG_ID"]
    if os.environ.get("KNOWLEDGE_AGENT_WALLET"):
        headers["x-agent-wallet"] = os.environ["KNOWLEDGE_AGENT_WALLET"]
    if os.environ.get("KNOWLEDGE_AGENT_ERC8004"):
        headers["x-agent-erc8004"] = os.environ["KNOWLEDGE_AGENT_ERC8004"]
    if os.environ.get("KNOWLEDGE_SEND_AGENT_ID") == "1" and os.environ.get("KNOWLEDGE_AGENT_ID"):
        headers["x-agent-id"] = os.environ["KNOWLEDGE_AGENT_ID"]
    return headers


def _request(method, path, body=None, org_id=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(BASE_URL + path, data=data, headers=_headers(org_id), method=method)
    try:
        with urllib.request.urlopen(req, timeout=int(os.environ.get("PERKOS_TECH_TIMEOUT", "30"))) as res:
            raw = res.read().decode("utf-8")
            return json.dumps(json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw) if raw else None
        except Exception:
            payload = {"raw": raw}
        return json.dumps({"ok": False, "status": e.code, "response": payload})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})


def perkos_skill_manifest(args, **kwargs):
    return _request("GET", "/skill/manifest")


def perkos_x402_policy(args, **kwargs):
    return _request("GET", "/api/x402/policy")


def perkos_knowledge_query(args, **kwargs):
    query = (args or {}).get("query", "").strip()
    if not query:
        return json.dumps({"ok": False, "error": "query_required"})
    return _request("POST", "/skill/query", {
        "query": query,
        "limit": (args or {}).get("limit", 5),
    }, org_id=(args or {}).get("organizationId"))
