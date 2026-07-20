import { prisma } from "@ops/db";
import { requireRole } from "@/server/authz";
import { withApi } from "@/server/handler";

export const GET = withApi(async ({ user }) => {
  requireRole(user, "operator", "approver", "auditor", "admin");
  return prisma.approval.findMany({
    where: { status: "PENDING" },
    include: { case: { select: { id: true, title: true, risk: true, priority: true } } },
    orderBy: { createdAt: "asc" },
  });
});
