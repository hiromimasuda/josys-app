#!/usr/bin/env python3
"""Read-only preflight validator for JOSYS-OPS-NAV-FABLE5-INPUT-001.

Python 3 stdlib re-implementation of docs/input/08_VERIFY_PACKET.ps1 for
environments without PowerShell (pwsh). Performs the same checks plus the
05_SEED_SCHEMA.json structural constraints (implemented manually because
the jsonschema package is not installed and package installs are not
authorized at Gate 0).

Reads docs/input/ only. Writes nothing. Exit 0 = PASS, 1 = FAIL.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

PACKET_ROOT = Path(__file__).resolve().parent.parent / "docs" / "input"

failures: list[str] = []
checks: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


def ok(msg: str) -> None:
    checks.append(msg)


# ---------------------------------------------------------------- SHA-256
hash_path = PACKET_ROOT / "07_SHA256SUMS.txt"
if not hash_path.is_file():
    fail("07_SHA256SUMS.txt is missing")
else:
    for line in hash_path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        m = re.match(r"^([a-fA-F0-9]{64})\s+\*?(.+)$", line)
        if not m:
            fail(f"Invalid hash line: {line}")
            continue
        expected = m.group(1).lower()
        rel = m.group(2).strip()
        target = PACKET_ROOT / rel
        if not target.is_file():
            fail(f"Hashed file is missing: {rel}")
            continue
        actual = hashlib.sha256(target.read_bytes()).hexdigest()
        if actual != expected:
            fail(f"SHA-256 mismatch: {rel} (expected {expected}, got {actual})")
        else:
            ok(f"SHA-256 OK: {rel}")

# ---------------------------------------------------------------- JSON parse
manifest = seed = schema = None
seed_raw = ""
try:
    manifest = json.loads((PACKET_ROOT / "01_MANIFEST.json").read_text(encoding="utf-8"))
    ok("01_MANIFEST.json parsed")
except Exception as e:  # noqa: BLE001
    fail(f"Manifest parse failed: {e}")
try:
    seed_raw = (PACKET_ROOT / "04_SEED_BUNDLE.json").read_text(encoding="utf-8")
    seed = json.loads(seed_raw)
    ok("04_SEED_BUNDLE.json parsed")
except Exception as e:  # noqa: BLE001
    fail(f"Seed parse failed: {e}")
try:
    schema = json.loads((PACKET_ROOT / "05_SEED_SCHEMA.json").read_text(encoding="utf-8"))
    ok("05_SEED_SCHEMA.json parsed")
except Exception as e:  # noqa: BLE001
    fail(f"Schema parse failed: {e}")

# ---------------------------------------------------------------- Manifest checks
if manifest is not None:
    for input_file in manifest.get("inputFiles", []):
        if input_file.get("required") and not (PACKET_ROOT / input_file["path"]).is_file():
            fail(f"Required input missing: {input_file['path']}")
    contract = manifest.get("executionContract", {})
    if contract.get("maximumAuthorizedGate") != "G2":
        fail("maximumAuthorizedGate must be G2")
    else:
        ok("maximumAuthorizedGate is G2")
    if (
        contract.get("productionWritesAllowed")
        or contract.get("productionDeploymentAllowed")
        or contract.get("productionConnectionsAllowed")
    ):
        fail("Production flags must all be false")
    else:
        ok("Production flags all false")

# ---------------------------------------------------------------- Seed checks
def unique_ids(items: list, name: str) -> None:
    ids = [item.get("id") for item in items]
    if len(ids) != len(set(ids)):
        fail(f"{name} contains duplicate ids")
    else:
        ok(f"{name} ids are unique: {len(ids)}")


if seed is not None:
    expected_counts = {"flows": 11, "operations": 43, "eventTemplates": 15}
    for coll, expected in expected_counts.items():
        actual = len(seed.get(coll, []))
        if actual != expected:
            fail(f"{coll} count is {actual}; expected {expected}")
        else:
            ok(f"{coll} count OK: {actual}")
        unique_ids(seed.get(coll, []), coll)

    for coll in (
        "roles", "mockUsers", "demoCases", "sourceAssets", "knowledgeDocuments",
        "scheduleOccurrences", "approvals", "evidence", "exceptions", "aiMockResponses",
    ):
        unique_ids(seed.get(coll, []), coll)

    flow_ids = {f["id"] for f in seed["flows"]}
    operation_ids = {o["id"] for o in seed["operations"]}
    event_ids = {e["id"] for e in seed["eventTemplates"]}
    role_ids = {r["id"] for r in seed["roles"]}
    user_ids = {u["id"] for u in seed["mockUsers"]}
    case_ids = {c["id"] for c in seed["demoCases"]}
    source_ids = {s["id"] for s in seed["sourceAssets"]}

    for op in seed["operations"]:
        if op["flowId"] not in flow_ids:
            fail(f"Unknown flowId on operation {op['id']}: {op['flowId']}")
        if op["operationalPriority"] is not None:
            fail(f"Operation priority must remain null: {op['id']}")
        if op["priorityFactStatus"] != "NEEDS_CONFIRMATION":
            fail(f"Operation priorityFactStatus must be NEEDS_CONFIRMATION: {op['id']}")
    ok("All operations: flowId valid, operationalPriority null, priorityFactStatus NEEDS_CONFIRMATION")

    # Per-flow expectedOperationCount vs actual (additional check beyond ps1)
    for flow in seed["flows"]:
        actual = sum(1 for o in seed["operations"] if o["flowId"] == flow["id"])
        if actual != flow["expectedOperationCount"]:
            fail(f"Flow {flow['id']} expects {flow['expectedOperationCount']} operations; found {actual}")
    ok("Per-flow expectedOperationCount matches actual operation distribution")

    for ev in seed["eventTemplates"]:
        if ev["mappingFactStatus"] != "PROPOSED":
            fail(f"Event mapping must remain PROPOSED: {ev['id']}")
        for op_id in ev["operationIds"]:
            if op_id not in operation_ids:
                fail(f"Unknown operation reference on {ev['id']}: {op_id}")
    ok("All eventTemplates: mappingFactStatus PROPOSED, operation references valid")

    for user in seed["mockUsers"]:
        for role_id in user["roleIds"]:
            if role_id not in role_ids:
                fail(f"Unknown role reference on {user['id']}: {role_id}")
    ok("All mockUsers reference valid roles")

    for case in seed["demoCases"]:
        if case["eventTemplateId"] not in event_ids:
            fail(f"Unknown event reference on {case['id']}: {case['eventTemplateId']}")
        if case["assigneeUserId"] not in user_ids:
            fail(f"Unknown user reference on {case['id']}: {case['assigneeUserId']}")
        for op_id in case["operationIds"]:
            if op_id not in operation_ids:
                fail(f"Unknown operation reference on {case['id']}: {op_id}")
    ok("All demoCases reference valid events, users and operations")

    for doc in seed["knowledgeDocuments"]:
        if doc["sourceAssetId"] not in source_ids:
            fail(f"Unknown source reference on {doc['id']}: {doc['sourceAssetId']}")
    ok("All knowledgeDocuments reference valid sourceAssets")

    for approval in seed["approvals"]:
        if approval["caseId"] not in case_ids or approval["requestedFromUserId"] not in user_ids:
            fail(f"Broken approval reference: {approval['id']}")
    ok("All approvals reference valid cases and users")

    # Additional referential checks not present in ps1
    for occ in seed["scheduleOccurrences"]:
        if occ["operationId"] not in operation_ids:
            fail(f"Unknown operation reference on {occ['id']}: {occ['operationId']}")
    for evd in seed["evidence"]:
        if evd["caseId"] not in case_ids:
            fail(f"Unknown case reference on {evd['id']}: {evd['caseId']}")
    for exc in seed["exceptions"]:
        if exc["caseId"] not in case_ids:
            fail(f"Unknown case reference on {exc['id']}: {exc['caseId']}")
        if exc["ownerUserId"] not in user_ids:
            fail(f"Unknown user reference on {exc['id']}: {exc['ownerUserId']}")
    for ai in seed["aiMockResponses"]:
        for src_id in ai["citationSourceIds"]:
            if src_id not in source_ids:
                fail(f"Unknown source reference on {ai['id']}: {src_id}")
    ok("Additional references valid: scheduleOccurrences, evidence, exceptions, aiMockResponses")

    # ------------------------------------------------------------ PII / secrets
    for m in re.finditer(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+", seed_raw):
        if not m.group(0).endswith("@example.invalid"):
            fail(f"Non-placeholder email found: {m.group(0)}")
    ok("All emails use @example.invalid")

    for m in re.finditer(r'https://[^"\s]+', seed_raw):
        host = re.match(r"https://([^/]+)", m.group(0))
        if host is None or not host.group(1).endswith("example.invalid"):
            fail(f"Non-placeholder URL found: {m.group(0)}")
    ok("All https URLs are on example.invalid")

    for pattern in (
        r"AKIA[0-9A-Z]{16}",
        r"AIza[0-9A-Za-z_-]{20,}",
        r"xox[baprs]-[0-9A-Za-z-]+",
        r"ghp_[0-9A-Za-z]{20,}",
        r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    ):
        if re.search(pattern, seed_raw):
            fail(f"Secret-like value matches pattern: {pattern}")
    ok("No secret-like values match known credential patterns")

# ------------------------------------------------- Manual 05_SEED_SCHEMA checks
# The jsonschema package is unavailable; the schema's structural constraints
# are re-implemented below (required, additionalProperties, pattern, enum,
# const, minItems/maxItems, uniqueItems) for every collection.
DATE_RE = r"^\d{4}-\d{2}-\d{2}$"
DATETIME_RE = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$"
FACT = ["CONFIRMED", "PROPOSED", "NEEDS_CONFIRMATION", "CONFLICTING"]
RISK = ["R0", "R1", "R2", "R3"]

def check_obj(obj: dict, spec: dict, where: str) -> None:
    for key in spec:
        rule = spec[key]
        required = rule.get("required", True)
        if key not in obj:
            if required:
                fail(f"{where}: missing required field '{key}'")
            continue
        val = obj[key]
        if "const" in rule and val != rule["const"]:
            fail(f"{where}.{key}: expected const {rule['const']!r}, got {val!r}")
        if "enum" in rule and val not in rule["enum"]:
            fail(f"{where}.{key}: {val!r} not in enum")
        if "pattern" in rule and (not isinstance(val, str) or not re.match(rule["pattern"], val)):
            fail(f"{where}.{key}: {val!r} does not match pattern {rule['pattern']}")
        if rule.get("type") == "array":
            if not isinstance(val, list):
                fail(f"{where}.{key}: expected array")
                continue
            if "minItems" in rule and len(val) < rule["minItems"]:
                fail(f"{where}.{key}: fewer than {rule['minItems']} items")
            if rule.get("uniqueItems") and len(val) != len(set(map(str, val))):
                fail(f"{where}.{key}: items not unique")
            if "itemPattern" in rule:
                for item in val:
                    if not isinstance(item, str) or not re.match(rule["itemPattern"], item):
                        fail(f"{where}.{key}: item {item!r} does not match pattern")
        if rule.get("type") == "boolean" and not isinstance(val, bool):
            fail(f"{where}.{key}: expected boolean")
        if rule.get("type") == "string" and not isinstance(val, str):
            fail(f"{where}.{key}: expected string")
        if rule.get("minLength") and isinstance(val, str) and len(val) < rule["minLength"]:
            fail(f"{where}.{key}: shorter than minLength")
    allowed = set(spec)
    extra = set(obj) - allowed
    if extra:
        fail(f"{where}: additionalProperties not allowed: {sorted(extra)}")


if seed is not None:
    top_allowed = {
        "$schema", "metadata", "flows", "operations", "eventTemplates", "roles",
        "mockUsers", "demoCases", "sourceAssets", "knowledgeDocuments",
        "scheduleOccurrences", "approvals", "evidence", "exceptions", "aiMockResponses",
    }
    extra_top = set(seed) - top_allowed
    if extra_top:
        fail(f"seed: additionalProperties not allowed at top level: {sorted(extra_top)}")
    missing_top = top_allowed - {"$schema"} - set(seed)
    if missing_top:
        fail(f"seed: missing required collections: {sorted(missing_top)}")

    check_obj(seed["metadata"], {
        "bundleId": {"const": "JOSYS-OPS-NAV-SEED-001"},
        "version": {"type": "string", "pattern": r"^[0-9]+\.[0-9]+\.[0-9]+$"},
        "asOf": {"type": "string", "pattern": DATE_RE},
        "locale": {"const": "ja-JP"},
        "timezone": {"const": "Asia/Tokyo"},
        "syntheticOnly": {"const": True},
        "demoOnly": {"const": True},
        "productionSeedAllowed": {"const": False},
        "fixedNow": {"type": "string", "pattern": DATETIME_RE},
    }, "metadata")

    size_bounds = {
        "roles": (8, 8), "mockUsers": (8, None), "demoCases": (5, None),
        "sourceAssets": (6, None), "knowledgeDocuments": (5, None),
        "scheduleOccurrences": (3, None), "approvals": (2, None),
        "evidence": (2, None), "exceptions": (1, None), "aiMockResponses": (2, None),
    }
    for coll, (lo, hi) in size_bounds.items():
        n = len(seed.get(coll, []))
        if n < lo or (hi is not None and n > hi):
            fail(f"{coll}: count {n} outside schema bounds [{lo}, {hi or '∞'}]")

    for i, f_ in enumerate(seed["flows"]):
        check_obj(f_, {
            "id": {"pattern": r"^F(?:0[1-9]|1[01])$"},
            "name": {"type": "string", "minLength": 1},
            "expectedOperationCount": {},
            "factStatus": {"enum": FACT},
        }, f"flows[{i}]")
    for i, o in enumerate(seed["operations"]):
        check_obj(o, {
            "id": {"pattern": r"^[1-7]-[0-9]{1,2}$"},
            "name": {"type": "string", "minLength": 1},
            "flowId": {"pattern": r"^F(?:0[1-9]|1[01])$"},
            "operationalPriority": {"enum": ["A0", "A1", "B", "C", "D", None]},
            "priorityFactStatus": {"enum": FACT},
            "factStatus": {"enum": FACT},
        }, f"operations[{i}]")
    for i, e in enumerate(seed["eventTemplates"]):
        check_obj(e, {
            "id": {"pattern": r"^EV-(?:0[1-9]|1[0-5])$"},
            "name": {"type": "string", "minLength": 1},
            "operationIds": {"type": "array", "minItems": 1, "uniqueItems": True,
                             "itemPattern": r"^[1-7]-[0-9]{1,2}$"},
            "initialRisk": {"enum": RISK},
            "riskNote": {"type": "string", "required": False},
            "nameFactStatus": {"enum": FACT},
            "mappingFactStatus": {"enum": FACT},
        }, f"eventTemplates[{i}]")
    for i, r in enumerate(seed["roles"]):
        check_obj(r, {
            "id": {"enum": ["employee", "operator", "approver", "knowledge_editor",
                             "knowledge_approver", "auditor", "admin", "service_account"]},
            "label": {"type": "string", "minLength": 1},
            "capabilities": {"type": "array", "uniqueItems": True},
        }, f"roles[{i}]")
    for i, u in enumerate(seed["mockUsers"]):
        check_obj(u, {
            "id": {"pattern": r"^USR-DEMO-[0-9]{3}$"},
            "displayName": {"pattern": r"^DEMO_"},
            "email": {"pattern": r"^[a-z0-9._-]+@example\.invalid$"},
            "roleIds": {"type": "array", "minItems": 1, "uniqueItems": True},
            "synthetic": {"const": True},
        }, f"mockUsers[{i}]")
    for i, c in enumerate(seed["demoCases"]):
        check_obj(c, {
            "id": {"pattern": r"^CASE-DEMO-[0-9]{3}$"},
            "title": {"type": "string", "minLength": 1},
            "eventTemplateId": {"pattern": r"^EV-(?:0[1-9]|1[0-5])$"},
            "operationIds": {"type": "array", "minItems": 1, "uniqueItems": True,
                             "itemPattern": r"^[1-7]-[0-9]{1,2}$"},
            "operationalPriority": {"enum": ["A0", "A1", "B", "C", "D"]},
            "risk": {"enum": RISK},
            "status": {"enum": ["OPEN", "IN_PROGRESS", "WAITING_APPROVAL", "BLOCKED", "COMPLETED"]},
            "assigneeUserId": {"pattern": r"^USR-DEMO-[0-9]{3}$"},
            "dueAt": {"pattern": DATETIME_RE},
            "demoOnly": {"const": True},
            "factStatus": {"enum": FACT},
        }, f"demoCases[{i}]")
    for i, s in enumerate(seed["sourceAssets"]):
        check_obj(s, {
            "id": {"pattern": r"^SRC-DEMO-[A-Z0-9-]+$"},
            "title": {"type": "string", "minLength": 1},
            "uri": {"pattern": r"^https://[a-z0-9.-]*example\.invalid/"},
            "authority": {"enum": ["AUTHORITATIVE_POLICY", "AUTHORITATIVE_RUNBOOK", "DECISION_RECORD",
                                    "EVIDENCE", "BROWSE_VIEW", "REFERENCE", "AUDIT_ONLY"]},
            "confidentiality": {"enum": ["INTERNAL", "RESTRICTED", "HIGH", "SECRET_POINTER_ONLY"]},
            "status": {"enum": ["ACTIVE", "STALE", "CONFLICTING", "RETIRED"]},
            "approvedForAi": {"type": "boolean"},
            "synthetic": {"const": True},
            "factStatus": {"enum": FACT},
        }, f"sourceAssets[{i}]")
    for i, k in enumerate(seed["knowledgeDocuments"]):
        check_obj(k, {
            "id": {"pattern": r"^KD-DEMO-[0-9]{3}$"},
            "sourceAssetId": {"pattern": r"^SRC-DEMO-[A-Z0-9-]+$"},
            "title": {"type": "string", "minLength": 1},
            "content": {"type": "string", "minLength": 1},
            "trustedInstructions": {"const": False},
            "searchable": {"type": "boolean"},
            "synthetic": {"const": True},
        }, f"knowledgeDocuments[{i}]")
    for i, s in enumerate(seed["scheduleOccurrences"]):
        check_obj(s, {
            "id": {"pattern": r"^SCH-DEMO-[0-9]{3}$"},
            "operationId": {"pattern": r"^[1-7]-[0-9]{1,2}$"},
            "title": {"type": "string", "minLength": 1},
            "startsAt": {"pattern": DATETIME_RE},
            "dueAt": {"pattern": DATETIME_RE},
            "status": {"enum": ["UPCOMING", "DUE", "OVERDUE", "DONE"]},
            "demoOnly": {"const": True},
        }, f"scheduleOccurrences[{i}]")
    for i, a in enumerate(seed["approvals"]):
        check_obj(a, {
            "id": {"pattern": r"^APR-DEMO-[0-9]{3}$"},
            "caseId": {"pattern": r"^CASE-DEMO-[0-9]{3}$"},
            "risk": {"enum": RISK},
            "status": {"enum": ["PENDING", "APPROVED", "REJECTED"]},
            "requestedFromUserId": {"pattern": r"^USR-DEMO-[0-9]{3}$"},
            "demoOnly": {"const": True},
        }, f"approvals[{i}]")
    for i, e in enumerate(seed["evidence"]):
        check_obj(e, {
            "id": {"pattern": r"^EVD-DEMO-[0-9]{3}$"},
            "caseId": {"pattern": r"^CASE-DEMO-[0-9]{3}$"},
            "kind": {"enum": ["CHECKLIST", "SCREENSHOT_POINTER", "AUDIT_NOTE", "TEST_RESULT"]},
            "uri": {"pattern": r"^https://[a-z0-9.-]*example\.invalid/"},
            "capturedAt": {"pattern": DATETIME_RE},
            "demoOnly": {"const": True},
        }, f"evidence[{i}]")
    for i, x in enumerate(seed["exceptions"]):
        check_obj(x, {
            "id": {"pattern": r"^EXC-DEMO-[0-9]{3}$"},
            "caseId": {"pattern": r"^CASE-DEMO-[0-9]{3}$"},
            "reason": {"type": "string", "minLength": 1},
            "ownerUserId": {"pattern": r"^USR-DEMO-[0-9]{3}$"},
            "dueAt": {"pattern": DATETIME_RE},
            "nextReviewAt": {"pattern": DATETIME_RE},
            "fallback": {"type": "string", "minLength": 1},
            "status": {"enum": ["OPEN", "RESOLVED"]},
            "demoOnly": {"const": True},
        }, f"exceptions[{i}]")
    for i, a in enumerate(seed["aiMockResponses"]):
        check_obj(a, {
            "id": {"pattern": r"^AI-DEMO-[0-9]{3}$"},
            "scenario": {"type": "string", "minLength": 1},
            "internalAnswerStatus": {"enum": ["FOUND", "NOT_FOUND", "CONFLICTING", "NOT_AUTHORIZED"]},
            "internalAnswer": {"type": "string"},
            "generalGuidance": {"type": "string"},
            "citationSourceIds": {"type": "array", "uniqueItems": True,
                                  "itemPattern": r"^SRC-DEMO-[A-Z0-9-]+$"},
            "confidence": {"enum": ["HIGH", "MEDIUM", "LOW"]},
            "escalationRequired": {"type": "boolean"},
            "actionExecutionAllowed": {"const": False},
            "demoOnly": {"const": True},
        }, f"aiMockResponses[{i}]")
    if not failures:
        ok("Manual 05_SEED_SCHEMA.json structural validation PASS (all collections)")

# ---------------------------------------------------------------- Result
result = {
    "Status": "PASS" if not failures else "FAIL",
    "Checks": len(checks),
    "Failures": len(failures),
    "FailureMessages": failures,
    "CheckMessages": checks,
}
print(json.dumps(result, ensure_ascii=False, indent=2))
sys.exit(1 if failures else 0)
