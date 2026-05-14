#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = os.environ.get("KNOWLEDGE_BASE_URL", "https://knowledge.perkos.xyz").rstrip("/")


def openclaw_agent_id():
    if os.environ.get("KNOWLEDGE_SEND_AGENT_ID") != "1":
        return None
    for path in ("/root/.openclaw/openclaw.json", os.path.expanduser("~/.openclaw/openclaw.json")):
        try:
            with open(path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            return (((cfg.get("models") or {}).get("providers") or {}).get("ollama") or {}).get("headers", {}).get("x-agent-id") or os.environ.get("KNOWLEDGE_AGENT_ID")
        except Exception:
            continue
    return os.environ.get("KNOWLEDGE_AGENT_ID")


def headers(auth=False):
    h = {"content-type": "application/json"}
    agent_id = openclaw_agent_id()
    if agent_id:
        h["x-agent-id"] = agent_id
    if os.environ.get("KNOWLEDGE_AGENT_WALLET"):
        h["x-agent-wallet"] = os.environ["KNOWLEDGE_AGENT_WALLET"]
    if os.environ.get("KNOWLEDGE_AGENT_ERC8004"):
        h["x-agent-erc8004"] = os.environ["KNOWLEDGE_AGENT_ERC8004"]
    if os.environ.get("KNOWLEDGE_ORG_ID"):
        h["x-organization-id"] = os.environ["KNOWLEDGE_ORG_ID"]
    if auth and os.environ.get("KNOWLEDGE_INGEST_TOKEN"):
        h["authorization"] = "Bearer " + os.environ["KNOWLEDGE_INGEST_TOKEN"]
    return h


def clean_body(body):
    if body is None:
        return None
    return {key: value for key, value in body.items() if value is not None}


def request(method, path, body=None, auth=False):
    body = clean_body(body)
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(BASE_URL + path, data=data, headers=headers(auth), method=method)
    try:
        with urllib.request.urlopen(req, timeout=int(os.environ.get("PERKOS_TECH_TIMEOUT", "30"))) as res:
            raw = res.read().decode("utf-8")
            return res.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw) if raw else None
        except Exception:
            payload = {"raw": raw}
        return e.code, payload


def main():
    parser = argparse.ArgumentParser(description="Use PerkOS technology APIs from OpenClaw/Hermes agents.")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("manifest")
    sub.add_parser("x402-policy")
    q = sub.add_parser("query")
    q.add_argument("query", nargs="+", help="Question/context query")
    q.add_argument("--limit", type=int, default=int(os.environ.get("KNOWLEDGE_LIMIT", "5")))
    q.add_argument("--create-request-on-miss", default=None)
    q.add_argument("--desired-output", default=None)
    r = sub.add_parser("requests")
    r.add_argument("--status", default="open")
    r.add_argument("--limit", type=int, default=25)
    rc = sub.add_parser("request-create")
    rc.add_argument("query", nargs="+")
    rc.add_argument("--priority", default=None)
    rc.add_argument("--desired-output", default=None)
    claim = sub.add_parser("request-claim")
    claim.add_argument("request")
    claim.add_argument("--notes", default=None)
    fulfill = sub.add_parser("request-fulfill")
    fulfill.add_argument("request")
    fulfill.add_argument("--item-ids", required=True)
    fulfill.add_argument("--notes", default=None)
    validate = sub.add_parser("request-validate")
    validate.add_argument("request")
    validate.add_argument("--accepted", default="true")
    validate.add_argument("--notes", default=None)
    submit = sub.add_parser("submit-research")
    submit.add_argument("--source", default=None)
    submit.add_argument("--visibility", default="private")
    submit.add_argument("--organization-id", default=os.environ.get("KNOWLEDGE_ORG_ID"))
    submit.add_argument("--contribution-type", default="research")
    submit.add_argument("--path", required=True)
    submit.add_argument("--title", default=None)
    submit.add_argument("--summary", default=None)
    submit.add_argument("--content", default=None)
    args = parser.parse_args()

    if args.cmd == "manifest":
        status, payload = request("GET", "/skill/manifest")
    elif args.cmd == "x402-policy":
        status, payload = request("GET", "/api/x402/policy")
    elif args.cmd == "query":
        create = None if args.create_request_on_miss is None else args.create_request_on_miss.lower() != "false"
        status, payload = request("POST", "/skill/query", {"query": " ".join(args.query), "limit": args.limit, "createRequestOnMiss": create, "desired_output": args.desired_output})
    elif args.cmd == "requests":
        status, payload = request("GET", f"/knowledge/requests?status={urllib.parse.quote(args.status)}&limit={urllib.parse.quote(str(args.limit))}")
    elif args.cmd == "request-create":
        status, payload = request("POST", "/knowledge/requests", {"query": " ".join(args.query), "priority": args.priority, "desired_output": args.desired_output})
    elif args.cmd == "request-claim":
        status, payload = request("POST", f"/knowledge/requests/{urllib.parse.quote(args.request)}/claim", {"notes": args.notes}, auth=True)
    elif args.cmd == "request-fulfill":
        item_ids = [x.strip() for x in args.item_ids.split(",") if x.strip()]
        status, payload = request("POST", f"/knowledge/requests/{urllib.parse.quote(args.request)}/fulfill", {"research_item_ids": item_ids, "notes": args.notes}, auth=True)
    elif args.cmd == "request-validate":
        status, payload = request("POST", f"/knowledge/requests/{urllib.parse.quote(args.request)}/validate", {"accepted": args.accepted.lower() != "false", "validation_notes": args.notes}, auth=True)
    else:
        status, payload = request("POST", "/api/ingest/research", {
            "source": args.source,
            "visibility": args.visibility,
            "organization_id": args.organization_id,
            "contribution_type": args.contribution_type,
            "items": [{
                "path": args.path,
                "title": args.title or args.path,
                "summary": args.summary,
                "content": args.content,
                "contribution_type": args.contribution_type,
            }]
        }, auth=True)

    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0 if 200 <= status < 300 else 1


if __name__ == "__main__":
    sys.exit(main())
