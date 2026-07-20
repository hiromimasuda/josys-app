// ケース関連の不変条件(§7.4)をサーバー側で強制する。UIをバイパスしても迂回できない。
import { prisma, type CaseStatus, type DemoUser, type Risk } from "@ops/db";
import { detectForbiddenInput } from "@ops/domain";
import { z } from "zod";
import { audit } from "../audit";
import { ApiError } from "../errors";
import { hasRole, requireRole } from "../authz";

export const createCaseSchema = z.object({
  eventTemplateId: z.string().regex(/^EV-(?:0[1-9]|1[0-5])$/),
  occurredAt: z.string().datetime({ offset: true }),
  impactTarget: z.string().min(1).max(200),
  impactScope: z.enum(["SINGLE_USER", "TEAM", "MULTI_TEAM", "COMPANY", "EXTERNAL"]),
  ongoing: z.boolean(),
  recentChange: z.boolean(),
  securitySignal: z.boolean(),
  summary: z.string().max(2000).default(""),
});

const HIGH_RISK: Risk[] = ["R2", "R3"];

export async function listCases(user: DemoUser) {
  // employeeは自分が作成したケースのみ(§3.2)
  const where = hasRole(user, "operator", "approver", "auditor", "admin", "knowledge_editor", "knowledge_approver")
    ? {}
    : { createdById: user.id };
  return prisma.case.findMany({
    where,
    orderBy: [{ createdAt: "asc" }],
    include: { approvals: true, evidence: true, exceptions: true },
  });
}

export async function getCase(user: DemoUser, caseId: string) {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      workItems: { orderBy: { sortOrder: "asc" } },
      approvals: { orderBy: { createdAt: "asc" } },
      evidence: { orderBy: { capturedAt: "asc" } },
      exceptions: true,
      eventTemplate: true,
      assignee: true,
    },
  });
  if (!c) throw new ApiError("NOT_FOUND", 404, "ケースが見つかりません。");
  if (!hasRole(user, "operator", "approver", "auditor", "admin", "knowledge_editor", "knowledge_approver") && c.createdById !== user.id) {
    throw new ApiError("FORBIDDEN", 403, "このケースを閲覧する権限がありません。");
  }
  return c;
}

export async function createCase(
  user: DemoUser,
  input: z.infer<typeof createCaseSchema>,
  correlationId: string,
) {
  // 一般社員は自分の依頼として作成可能(§3.2)。service_accountは不可。
  if (hasRole(user, "service_account")) {
    throw new ApiError("FORBIDDEN", 403, "同期アカウントはケースを作成できません。");
  }
  const forbidden = detectForbiddenInput(`${input.impactTarget} ${input.summary}`);
  if (forbidden) {
    throw new ApiError("FORBIDDEN_INPUT", 400, `${forbidden}が含まれている可能性があるため保存できません。秘密情報・個人情報の全文は入力できません。`);
  }
  const ev = await prisma.eventTemplate.findUnique({ where: { id: input.eventTemplateId } });
  if (!ev) throw new ApiError("NOT_FOUND", 404, "発生種別が見つかりません。");

  const count = await prisma.case.count();
  const id = `CASE-${String(count + 1).padStart(4, "0")}`;
  // 暫定優先度: 行別A0-Dは未確定のため、セキュリティ兆候/影響範囲から仮置きし、factStatusはPROPOSEDのまま
  const priority = input.securitySignal || input.impactScope === "COMPANY" ? "A0" : "B";
  const risk = input.securitySignal ? "R3" : ev.initialRisk;

  const created = await prisma.case.create({
    data: {
      id,
      title: `${ev.name}: ${input.impactTarget}`,
      eventTemplateId: ev.id,
      operationIds: ev.operationIds,
      priority,
      risk,
      status: "OPEN",
      impactScope: input.impactScope,
      ongoing: input.ongoing,
      recentChange: input.recentChange,
      securitySignal: input.securitySignal,
      summarySanitized: input.summary,
      occurredAt: new Date(input.occurredAt),
      assigneeUserId: null,
      createdById: user.id,
      factStatus: "PROPOSED",
    },
  });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "CASE_CREATED",
    entityType: "Case", entityId: created.id, result: "SUCCESS", correlationId, risk: created.risk,
  });
  return created;
}

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ["IN_PROGRESS", "BLOCKED", "WAITING_APPROVAL"],
  IN_PROGRESS: ["WAITING_APPROVAL", "BLOCKED", "OPEN"],
  WAITING_APPROVAL: ["IN_PROGRESS", "BLOCKED"],
  BLOCKED: ["IN_PROGRESS", "OPEN"],
  COMPLETED: [],
};

export async function updateCaseStatus(
  user: DemoUser,
  caseId: string,
  next: CaseStatus,
  correlationId: string,
) {
  requireRole(user, "operator", "admin");
  if (next === "COMPLETED") {
    throw new ApiError("USE_COMPLETE_ENDPOINT", 400, "完了はcompleteエンドポイントで検証付きで行ってください。");
  }
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) throw new ApiError("NOT_FOUND", 404, "ケースが見つかりません。");
  if (!TRANSITIONS[c.status].includes(next)) {
    throw new ApiError("INVALID_TRANSITION", 400, `状態 ${c.status} から ${next} へは遷移できません。`);
  }
  const updated = await prisma.case.update({ where: { id: caseId }, data: { status: next } });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "CASE_STATUS_CHANGED",
    entityType: "Case", entityId: caseId, result: "SUCCESS", correlationId, risk: c.risk,
  });
  return updated;
}

export const completeSchema = z.object({
  emergency: z
    .object({
      reason: z.string().min(1),
      sharedAt: z.string().datetime({ offset: true }),
      minimalActions: z.string().min(1),
      postReviewAt: z.string().datetime({ offset: true }),
    })
    .optional(),
});

// §7.4不変条件: R2/R3は承認+実行前/実行後/本人確認証跡なしで完了不可。
// R3は事前承認がない場合、緊急封じ込め(理由・共有時刻・最小操作・事後確認)を必須(AC-013相当)。
export async function completeCase(
  user: DemoUser,
  caseId: string,
  input: z.infer<typeof completeSchema>,
  correlationId: string,
) {
  requireRole(user, "operator", "admin");
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { approvals: true, evidence: true },
  });
  if (!c) throw new ApiError("NOT_FOUND", 404, "ケースが見つかりません。");
  if (c.status === "COMPLETED") {
    throw new ApiError("ALREADY_COMPLETED", 400, "このケースは完了済みです。");
  }

  const deny = async (code: string, message: string, details: Record<string, unknown>) => {
    await audit({
      actorId: user.id, actorRoles: user.roles, action: "CASE_COMPLETE_DENIED",
      entityType: "Case", entityId: caseId, result: "DENIED", correlationId,
      risk: c.risk, reasonCode: code,
    });
    throw new ApiError(code, 409, message, { risk: c.risk, ...details });
  };

  if (HIGH_RISK.includes(c.risk)) {
    const kinds = new Set(c.evidence.map((e) => e.kind));
    const requiredKinds = ["BEFORE", "AFTER", "USER_CONFIRMATION"] as const;
    const missing = requiredKinds.filter((k) => !kinds.has(k));
    if (missing.length > 0) {
      await deny("EVIDENCE_REQUIRED", "必須証跡(実行前・実行後・本人確認)が不足しています。", {
        missing_evidence: missing,
      });
    }
    const approved = c.approvals.some((a) => a.status === "APPROVED");
    if (!approved) {
      if (c.risk === "R2") {
        await deny("APPROVAL_REQUIRED", "R2は実行前承認なしで完了できません。", { required_role: "approver" });
      }
      // R3: 緊急封じ込めの記録があれば事後確認前提で完了可
      if (!input.emergency) {
        await deny("APPROVAL_OR_EMERGENCY_REQUIRED", "R3は承認または緊急封じ込め記録(理由・共有時刻・最小操作・事後確認予定)が必要です。", {
          required: ["approval", "emergency justification"],
        });
      }
    }
  }

  const updated = await prisma.case.update({
    where: { id: caseId },
    data: {
      status: "COMPLETED",
      closedAt: new Date(),
      ongoing: false,
      emergencyReason: input.emergency
        ? `理由: ${input.emergency.reason} / 共有: ${input.emergency.sharedAt} / 最小操作: ${input.emergency.minimalActions} / 事後確認予定: ${input.emergency.postReviewAt}`
        : c.emergencyReason,
    },
  });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "CASE_COMPLETED",
    entityType: "Case", entityId: caseId, result: "SUCCESS", correlationId,
    risk: c.risk, reasonCode: input.emergency ? "EMERGENCY_CONTAINMENT" : null,
  });
  return updated;
}

export const evidenceSchema = z.object({
  kind: z.enum(["BEFORE", "AFTER", "USER_CONFIRMATION", "APPROVAL", "ROLLBACK_TEST", "CHECKLIST", "SCREENSHOT_POINTER", "AUDIT_NOTE", "TEST_RESULT", "LOG_POINTER"]),
  uri: z.string().regex(/^https:\/\/[a-z0-9.-]*example\.invalid\//, "証跡URIはデモではexample.invalidのポインタのみ許可します。"),
  description: z.string().max(500).default(""),
});

export async function addEvidence(
  user: DemoUser,
  caseId: string,
  input: z.infer<typeof evidenceSchema>,
  correlationId: string,
) {
  requireRole(user, "operator", "approver", "admin");
  const forbidden = detectForbiddenInput(input.description);
  if (forbidden) throw new ApiError("FORBIDDEN_INPUT", 400, `${forbidden}を含む説明は保存できません。`);
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) throw new ApiError("NOT_FOUND", 404, "ケースが見つかりません。");
  const created = await prisma.evidence.create({
    data: { caseId, kind: input.kind, uri: input.uri, description: input.description, capturedById: user.id },
  });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "EVIDENCE_ADDED",
    entityType: "Evidence", entityId: created.id, result: "SUCCESS", correlationId, risk: c.risk,
  });
  return created;
}

export const approvalRequestSchema = z.object({
  requestedAction: z.string().min(1).max(300),
});

export async function requestApproval(
  user: DemoUser,
  caseId: string,
  input: z.infer<typeof approvalRequestSchema>,
  correlationId: string,
) {
  requireRole(user, "operator", "admin");
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) throw new ApiError("NOT_FOUND", 404, "ケースが見つかりません。");
  const approver = await prisma.demoUser.findFirst({ where: { roles: { has: "approver" } } });
  if (!approver) throw new ApiError("NOT_FOUND", 404, "承認者ロールのDEMOユーザーがいません。");
  const created = await prisma.approval.create({
    data: {
      caseId, risk: c.risk, requestedAction: input.requestedAction,
      requestedFromUserId: approver.id, requestedById: user.id,
    },
  });
  if (c.status !== "WAITING_APPROVAL" && c.status !== "COMPLETED") {
    await prisma.case.update({ where: { id: caseId }, data: { status: "WAITING_APPROVAL" } });
  }
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "APPROVAL_REQUESTED",
    entityType: "Approval", entityId: created.id, result: "SUCCESS", correlationId, risk: c.risk,
  });
  return created;
}

export const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().min(1).max(500),
});

export async function decideApproval(
  user: DemoUser,
  approvalId: string,
  input: z.infer<typeof decisionSchema>,
  correlationId: string,
) {
  requireRole(user, "approver", "admin"); // AC-018相当: 承認者以外は不可
  const approval = await prisma.approval.findUnique({ where: { id: approvalId }, include: { case: true } });
  if (!approval) throw new ApiError("NOT_FOUND", 404, "承認依頼が見つかりません。");
  if (approval.status !== "PENDING") throw new ApiError("ALREADY_DECIDED", 400, "この承認依頼は判断済みです。");
  const updated = await prisma.approval.update({
    where: { id: approvalId },
    data: { status: input.decision, decidedById: user.id, decisionReason: input.reason, decidedAt: new Date() },
  });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "APPROVAL_DECIDED",
    entityType: "Approval", entityId: approvalId, result: "SUCCESS", correlationId,
    risk: approval.risk, reasonCode: input.decision,
  });
  return updated;
}

export const exceptionSchema = z.object({
  reason: z.string().min(1).max(500),
  dueAt: z.string().datetime({ offset: true }),
  nextReviewAt: z.string().datetime({ offset: true }),
  fallback: z.string().min(1).max(500),
});

// AC-020相当: 例外は担当・期限・次回確認日・代替策が必須(zodで強制)
export async function addException(
  user: DemoUser,
  caseId: string,
  input: z.infer<typeof exceptionSchema>,
  correlationId: string,
) {
  requireRole(user, "operator", "approver", "admin");
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) throw new ApiError("NOT_FOUND", 404, "ケースが見つかりません。");
  const created = await prisma.caseException.create({
    data: {
      caseId, reason: input.reason, ownerUserId: user.id,
      dueAt: new Date(input.dueAt), nextReviewAt: new Date(input.nextReviewAt), fallback: input.fallback,
    },
  });
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "EXCEPTION_ADDED",
    entityType: "CaseException", entityId: created.id, result: "SUCCESS", correlationId, risk: c.risk,
  });
  return created;
}
