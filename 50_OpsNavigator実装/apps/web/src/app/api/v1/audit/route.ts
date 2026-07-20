import { prisma } from "@ops/db";
import { requireRole } from "@/server/authz";
import { withApi } from "@/server/handler";

// 監査ビュー(§9.6): auditor/adminのみ。追記専用の読み出し。
export const GET = withApi(async ({ user }) => {
  requireRole(user, "auditor", "admin");
  return prisma.auditEvent.findMany({ orderBy: { occurredAt: "desc" }, take: 200 });
});
