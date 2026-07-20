// AuditEvent: 追記専用(§9.6)。update/deleteはアプリから行わない。
// 質問本文・個人情報・秘密情報は保存しない。
import { prisma, type AuditResult, type Risk } from "@ops/db";

export async function audit(entry: {
  actorId: string;
  actorRoles: string[];
  action: string;
  entityType: string;
  entityId: string;
  result: AuditResult;
  correlationId: string;
  risk?: Risk | null;
  reasonCode?: string | null;
}): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorId: entry.actorId,
      actorRoles: entry.actorRoles,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      result: entry.result,
      correlationId: entry.correlationId,
      risk: entry.risk ?? null,
      reasonCode: entry.reasonCode ?? null,
    },
  });
}

export function newCorrelationId(): string {
  return `CORR-${crypto.randomUUID()}`;
}
