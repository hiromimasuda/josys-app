import { prisma, type DemoUser } from "@ops/db";

export async function getUser(id: string): Promise<DemoUser> {
  const u = await prisma.demoUser.findUnique({ where: { id } });
  if (!u) throw new Error(`missing demo user ${id} — run pnpm db:seed first`);
  return u;
}

export const USERS = {
  employee: "USR-DEMO-001",
  operator: "USR-DEMO-002",
  approver: "USR-DEMO-003",
  knowledgeEditor: "USR-DEMO-004",
  knowledgeApprover: "USR-DEMO-005",
  auditor: "USR-DEMO-006",
  admin: "USR-DEMO-007",
} as const;

export const CORR = "CORR-integration-test";

export function baseCaseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    eventTemplateId: "EV-08", // Drive権限・外部共有 → R2
    occurredAt: "2026-07-17T16:00:00+09:00",
    impactTarget: "integrationテスト対象",
    impactScope: "TEAM" as const,
    ongoing: true,
    recentChange: false,
    securitySignal: false,
    summary: "",
    ...overrides,
  };
}
