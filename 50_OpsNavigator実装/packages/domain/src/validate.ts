import type { SeedBundle } from "./types";

export interface SeedValidationResult {
  counts: { flows: number; operations: number; eventTemplates: number };
  errors: string[];
}

// 11/43/15件数・ID一意性・参照整合・統制値(優先度null/PROPOSED維持)の機械検証。
// docs/input/06_GATE_ACCEPTANCE_CHECKLIST.md Gate 1「11/43/15件数検証」に対応。
export function validateSeed(seed: SeedBundle): SeedValidationResult {
  const errors: string[] = [];
  const expect = { flows: 11, operations: 43, eventTemplates: 15 } as const;
  for (const [key, expected] of Object.entries(expect) as ["flows" | "operations" | "eventTemplates", number][]) {
    const actual = seed[key].length;
    if (actual !== expected) errors.push(`${key} count ${actual} !== ${expected}`);
  }

  const collections: [string, { id: string }[]][] = [
    ["flows", seed.flows],
    ["operations", seed.operations],
    ["eventTemplates", seed.eventTemplates],
    ["roles", seed.roles],
    ["mockUsers", seed.mockUsers],
    ["demoCases", seed.demoCases],
    ["sourceAssets", seed.sourceAssets],
    ["knowledgeDocuments", seed.knowledgeDocuments],
    ["scheduleOccurrences", seed.scheduleOccurrences],
    ["approvals", seed.approvals],
    ["evidence", seed.evidence],
    ["exceptions", seed.exceptions],
    ["aiMockResponses", seed.aiMockResponses],
  ];
  for (const [name, items] of collections) {
    const ids = items.map((i) => i.id);
    if (new Set(ids).size !== ids.length) errors.push(`${name} has duplicate ids`);
  }

  const flowIds = new Set(seed.flows.map((f) => f.id));
  const opIds = new Set(seed.operations.map((o) => o.id));
  const evIds = new Set(seed.eventTemplates.map((e) => e.id));
  const roleIds = new Set(seed.roles.map((r) => r.id));
  const userIds = new Set(seed.mockUsers.map((u) => u.id));
  const caseIds = new Set(seed.demoCases.map((c) => c.id));
  const srcIds = new Set(seed.sourceAssets.map((s) => s.id));

  for (const op of seed.operations) {
    if (!flowIds.has(op.flowId)) errors.push(`operation ${op.id}: unknown flow ${op.flowId}`);
    if (op.operationalPriority !== null) errors.push(`operation ${op.id}: priority must stay null in packet`);
    if (op.priorityFactStatus !== "NEEDS_CONFIRMATION")
      errors.push(`operation ${op.id}: priorityFactStatus must stay NEEDS_CONFIRMATION`);
  }
  for (const flow of seed.flows) {
    const actual = seed.operations.filter((o) => o.flowId === flow.id).length;
    if (actual !== flow.expectedOperationCount)
      errors.push(`flow ${flow.id}: expected ${flow.expectedOperationCount} operations, found ${actual}`);
  }
  for (const ev of seed.eventTemplates) {
    if (ev.mappingFactStatus !== "PROPOSED") errors.push(`event ${ev.id}: mapping must stay PROPOSED`);
    for (const id of ev.operationIds) if (!opIds.has(id)) errors.push(`event ${ev.id}: unknown operation ${id}`);
  }
  for (const u of seed.mockUsers)
    for (const r of u.roleIds) if (!roleIds.has(r)) errors.push(`user ${u.id}: unknown role ${r}`);
  for (const c of seed.demoCases) {
    if (!evIds.has(c.eventTemplateId)) errors.push(`case ${c.id}: unknown event ${c.eventTemplateId}`);
    if (!userIds.has(c.assigneeUserId)) errors.push(`case ${c.id}: unknown user ${c.assigneeUserId}`);
    for (const id of c.operationIds) if (!opIds.has(id)) errors.push(`case ${c.id}: unknown operation ${id}`);
  }
  for (const d of seed.knowledgeDocuments)
    if (!srcIds.has(d.sourceAssetId)) errors.push(`doc ${d.id}: unknown source ${d.sourceAssetId}`);
  for (const s of seed.scheduleOccurrences)
    if (!opIds.has(s.operationId)) errors.push(`occurrence ${s.id}: unknown operation ${s.operationId}`);
  for (const a of seed.approvals) {
    if (!caseIds.has(a.caseId)) errors.push(`approval ${a.id}: unknown case ${a.caseId}`);
    if (!userIds.has(a.requestedFromUserId)) errors.push(`approval ${a.id}: unknown user`);
  }
  for (const e of seed.evidence) if (!caseIds.has(e.caseId)) errors.push(`evidence ${e.id}: unknown case`);
  for (const x of seed.exceptions) {
    if (!caseIds.has(x.caseId)) errors.push(`exception ${x.id}: unknown case`);
    if (!userIds.has(x.ownerUserId)) errors.push(`exception ${x.id}: unknown user`);
  }
  for (const ai of seed.aiMockResponses)
    for (const id of ai.citationSourceIds) if (!srcIds.has(id)) errors.push(`ai ${ai.id}: unknown source ${id}`);

  return {
    counts: {
      flows: seed.flows.length,
      operations: seed.operations.length,
      eventTemplates: seed.eventTemplates.length,
    },
    errors,
  };
}
