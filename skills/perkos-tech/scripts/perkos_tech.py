#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

BASE_URL = os.environ.get("KNOWLEDGE_BASE_URL", "https://knowledge.perkos.xyz").rstrip("/")


def openclaw_agent_id():
    if os.environ.get("KNOWLEDGE_SEND_AGENT_ID") != "1":
        return None
    for path in ("/root/.openclaw/openclaw.json", os.path.expanduser("~/.openclaw/openclaw.json")):
        try:
            with open(path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            return (((cfg.get("models") or {}).get("providers") or {}).get("ollama") or {}).get("headers", {}).get("x-agent-id")
        except Exception:
            continue
    return None


def headers():
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
    return h


def request(method, path, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(BASE_URL + path, data=data, headers=headers(), method=method)
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
    args = parser.parse_args()

    if args.cmd == "manifest":
        status, payload = request("GET", "/skill/manifest")
    elif args.cmd == "x402-policy":
        status, payload = request("GET", "/api/x402/policy")
    else:
        status, payload = request("POST", "/skill/query", {"query": " ".join(args.query), "limit": args.limit})

    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0 if 200 <= status < 300 else 1


if __name__ == "__main__":
    sys.exit(main())
