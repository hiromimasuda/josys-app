import { prisma } from "@ops/db";
import { requireRole } from "@/server/authz";
import { withApi } from "@/server/handler";

// 管理メタデータ(AC-022相当: 非adminはサーバー側で403)
export const GET = withApi(async ({ user }) => {
  requireRole(user, "admin");
  return {
    flows: await prisma.flow.count(),
    operations: await prisma.operation.count(),
    eventTemplates: await prisma.eventTemplate.count(),
    users: await prisma.demoUser.count(),
    cases: await prisma.case.count(),
    auditEvents: await prisma.auditEvent.count(),
    aiEnabled: process.env.AI_ENABLED === "true",
    externalWritesEnabled: process.env.EXTERNAL_WRITES_ENABLED === "true",
  };
});
