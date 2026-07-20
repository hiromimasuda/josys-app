// 引継ぎ受領(§5.11 / AC-021相当): 実動作と証跡がない「受領」を拒否する。
import { prisma, type DemoUser } from "@ops/db";
import { z } from "zod";
import { audit } from "../audit";
import { ApiError } from "../errors";
import { requireRole } from "../authz";

export const acceptanceSchema = z.object({
  scenario: z.string().min(1).max(300),
  operated: z.boolean(),
  evidenceUri: z.string().regex(/^https:\/\/[a-z0-9.-]*example\.invalid\//).optional(),
  result: z.enum(["ACCEPTED", "RETURNED"]),
  notes: z.string().max(1000).default(""),
});

export async function recordAcceptance(
  user: DemoUser,
  input: z.infer<typeof acceptanceSchema>,
  correlationId: string,
) {
  requireRole(user, "operator", "approver", "admin");
  if (input.result === "ACCEPTED" && (!input.operated || !input.evidenceUri)) {
    throw new ApiError(
      "ACCEPTANCE_REQUIRES_OPERATION_AND_EVIDENCE",
      409,
      "受領には実動作の実施と証跡リンクが必要です。説明を聞いただけでは受領にできません。",
      { required: ["operated=true", "evidenceUri"] },
    );
  }
  const created = await prisma.acceptanceCheck.create({
    data: {
      scenario: input.scenario,
      operated: input.operated,
      evidenceUri: input.evidenceUri ?? null,
      result: input.result,
      notes: input.notes,
      performedById: user.id,
    },
  });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "ACCEPTANCE_RECORDED",
    entityType: "AcceptanceCheck", entityId: created.id, result: "SUCCESS", correlationId,
    reasonCode: input.result,
  });
  return created;
}

export async function listAcceptance(user: DemoUser) {
  requireRole(user, "operator", "approver", "auditor", "admin");
  return prisma.acceptanceCheck.findMany({ orderBy: { recordedAt: "asc" }, include: { performedBy: true } });
}
