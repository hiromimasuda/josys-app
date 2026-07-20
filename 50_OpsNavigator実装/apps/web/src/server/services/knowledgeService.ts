// ナレッジ候補の改善ループ(§8.8): 候補作成→人レビュー→承認のみ公開(AC-019/020相当)。
import { prisma, type DemoUser } from "@ops/db";
import { detectForbiddenInput } from "@ops/domain";
import { z } from "zod";
import { audit } from "../audit";
import { ApiError } from "./../errors";
import { requireRole } from "../authz";

export const candidateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(4000),
  caseId: z.string().optional(),
});

export async function createCandidate(
  user: DemoUser,
  input: z.infer<typeof candidateSchema>,
  correlationId: string,
) {
  requireRole(user, "operator", "knowledge_editor", "admin");
  const forbidden = detectForbiddenInput(`${input.title} ${input.content}`);
  if (forbidden) throw new ApiError("FORBIDDEN_INPUT", 400, `${forbidden}を含む候補は作成できません。`);
  const created = await prisma.knowledgeCandidate.create({
    data: { title: input.title, content: input.content, caseId: input.caseId ?? null, createdById: user.id },
  });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "KNOWLEDGE_CANDIDATE_CREATED",
    entityType: "KnowledgeCandidate", entityId: created.id, result: "SUCCESS", correlationId,
  });
  return created;
}

export async function listCandidates(user: DemoUser) {
  requireRole(user, "operator", "knowledge_editor", "knowledge_approver", "admin", "auditor");
  return prisma.knowledgeCandidate.findMany({ orderBy: { createdAt: "asc" } });
}

export const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().min(1).max(500),
});

// 公開(承認)はknowledge_approverのみ。AuditEventを残す(AC-020相当)。
export async function reviewCandidate(
  user: DemoUser,
  candidateId: string,
  input: z.infer<typeof reviewSchema>,
  correlationId: string,
) {
  requireRole(user, "knowledge_approver", "admin");
  const candidate = await prisma.knowledgeCandidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new ApiError("NOT_FOUND", 404, "候補が見つかりません。");
  if (candidate.status !== "PENDING") throw new ApiError("ALREADY_DECIDED", 400, "この候補はレビュー済みです。");
  const updated = await prisma.knowledgeCandidate.update({
    where: { id: candidateId },
    data: { status: input.decision, reviewedById: user.id, reviewNote: input.note, reviewedAt: new Date() },
  });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "KNOWLEDGE_CANDIDATE_REVIEWED",
    entityType: "KnowledgeCandidate", entityId: candidateId, result: "SUCCESS", correlationId,
    reasonCode: input.decision,
  });
  return updated;
}
