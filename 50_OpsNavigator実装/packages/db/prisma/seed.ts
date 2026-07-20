// docs/input/04_SEED_BUNDLE.json(読み取り専用)からDEMO_ONLYローカルDBへseedする。
// 値の追加・推測をしない: 優先度null維持、mapping PROPOSED維持、合成データのみ。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const here = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.resolve(here, "../../../docs/input/04_SEED_BUNDLE.json");
const seed = JSON.parse(readFileSync(bundlePath, "utf8"));

const prisma = new PrismaClient();

async function main() {
  if (!seed.metadata?.syntheticOnly || !seed.metadata?.demoOnly || seed.metadata?.productionSeedAllowed) {
    throw new Error("SEED_REFUSED: bundle is not marked syntheticOnly/demoOnly");
  }

  // 冪等: 依存順に全削除してから投入(DEMO専用DBに限る)
  await prisma.auditEvent.deleteMany();
  await prisma.acceptanceCheck.deleteMany();
  await prisma.knowledgeCandidate.deleteMany();
  await prisma.caseException.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.case.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.sourceAsset.deleteMany();
  await prisma.scheduleOccurrence.deleteMany();
  await prisma.eventTemplate.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.flow.deleteMany();
  await prisma.demoUser.deleteMany();

  await prisma.demoUser.createMany({
    data: seed.mockUsers.map((u: any) => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      roles: u.roleIds,
      synthetic: true,
    })),
  });

  await prisma.flow.createMany({
    data: seed.flows.map((f: any) => ({
      id: f.id,
      name: f.name,
      expectedOperationCount: f.expectedOperationCount,
      factStatus: f.factStatus,
    })),
  });

  await prisma.operation.createMany({
    data: seed.operations.map((o: any) => ({
      id: o.id,
      name: o.name,
      flowId: o.flowId,
      operationalPriority: o.operationalPriority, // null維持
      priorityFactStatus: o.priorityFactStatus,
      factStatus: o.factStatus,
    })),
  });

  await prisma.eventTemplate.createMany({
    data: seed.eventTemplates.map((e: any) => ({
      id: e.id,
      name: e.name,
      operationIds: e.operationIds,
      initialRisk: e.initialRisk,
      riskNote: e.riskNote ?? null,
      nameFactStatus: e.nameFactStatus,
      mappingFactStatus: e.mappingFactStatus, // PROPOSED維持
    })),
  });

  await prisma.sourceAsset.createMany({
    data: seed.sourceAssets.map((s: any) => ({
      id: s.id,
      title: s.title,
      uri: s.uri,
      authority: s.authority,
      confidentiality: s.confidentiality,
      status: s.status,
      approvedForAi: s.approvedForAi,
      factStatus: s.factStatus,
      synthetic: true,
    })),
  });

  await prisma.knowledgeDocument.createMany({
    data: seed.knowledgeDocuments.map((d: any) => ({
      id: d.id,
      sourceAssetId: d.sourceAssetId,
      title: d.title,
      content: d.content,
      trustedInstructions: false,
      searchable: d.searchable,
    })),
  });

  await prisma.scheduleOccurrence.createMany({
    data: seed.scheduleOccurrences.map((s: any) => ({
      id: s.id,
      operationId: s.operationId,
      title: s.title,
      startsAt: new Date(s.startsAt),
      dueAt: new Date(s.dueAt),
      status: s.status,
    })),
  });

  for (const c of seed.demoCases) {
    await prisma.case.create({
      data: {
        id: c.id,
        title: c.title,
        eventTemplateId: c.eventTemplateId,
        operationIds: c.operationIds,
        priority: c.operationalPriority,
        risk: c.risk,
        status: c.status === "OPEN" ? "OPEN" : c.status,
        assigneeUserId: c.assigneeUserId,
        dueAt: new Date(c.dueAt),
        factStatus: c.factStatus,
        demoOnly: true,
      },
    });
  }

  await prisma.approval.createMany({
    data: seed.approvals.map((a: any) => ({
      id: a.id,
      caseId: a.caseId,
      risk: a.risk,
      status: a.status,
      requestedFromUserId: a.requestedFromUserId,
      requestedAction: "DEMO承認依頼",
    })),
  });

  await prisma.evidence.createMany({
    data: seed.evidence.map((e: any) => ({
      id: e.id,
      caseId: e.caseId,
      kind: e.kind,
      uri: e.uri,
      capturedAt: new Date(e.capturedAt),
    })),
  });

  await prisma.caseException.createMany({
    data: seed.exceptions.map((x: any) => ({
      id: x.id,
      caseId: x.caseId,
      reason: x.reason,
      ownerUserId: x.ownerUserId,
      dueAt: new Date(x.dueAt),
      nextReviewAt: new Date(x.nextReviewAt),
      fallback: x.fallback,
      status: x.status,
    })),
  });

  // WorkItem: CASE-DEMO-001(Wi-Fi障害)の実行単位デモ
  await prisma.workItem.createMany({
    data: [
      { caseId: "CASE-DEMO-001", title: "影響範囲の確認(拠点・人数・開始時刻)", status: "DONE", sortOrder: 1 },
      { caseId: "CASE-DEMO-001", title: "既知の代替手段の案内", status: "IN_PROGRESS", sortOrder: 2 },
      { caseId: "CASE-DEMO-001", title: "復旧判断者への共有", status: "TODO", sortOrder: 3 },
    ],
  });

  const counts = {
    flows: await prisma.flow.count(),
    operations: await prisma.operation.count(),
    eventTemplates: await prisma.eventTemplate.count(),
    users: await prisma.demoUser.count(),
    cases: await prisma.case.count(),
    sources: await prisma.sourceAsset.count(),
    documents: await prisma.knowledgeDocument.count(),
  };
  if (counts.flows !== 11 || counts.operations !== 43 || counts.eventTemplates !== 15) {
    throw new Error(`SEED_COUNT_MISMATCH: ${JSON.stringify(counts)}`);
  }
  console.log("seed OK:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
