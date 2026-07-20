// §7.4不変条件: R2/R3の完了ガードをサーバー側で検証(AC-012/013/017/019相当)。
import { beforeAll, describe, expect, it } from "vitest";
import { prisma, type DemoUser } from "@ops/db";
import {
  addEvidence, completeCase, createCase, decideApproval, requestApproval, updateCaseStatus,
} from "@/server/services/caseService";
import { CORR, USERS, baseCaseInput, getUser } from "./helpers";

let operator: DemoUser;
let approver: DemoUser;

beforeAll(async () => {
  operator = await getUser(USERS.operator);
  approver = await getUser(USERS.approver);
});

async function addRequiredEvidence(caseId: string) {
  for (const kind of ["BEFORE", "AFTER", "USER_CONFIRMATION"] as const) {
    await addEvidence(operator, caseId, {
      kind,
      uri: `https://evidence.example.invalid/${caseId.toLowerCase()}/${kind.toLowerCase()}`,
      description: "",
    }, CORR);
  }
}

describe("R2 completion guard", () => {
  it("証跡なし→EVIDENCE_REQUIRED、証跡のみ→APPROVAL_REQUIRED、承認後→完了可", async () => {
    const c = await createCase(operator, baseCaseInput(), CORR); // EV-08 → R2
    expect(c.risk).toBe("R2");

    await expect(completeCase(operator, c.id, {}, CORR)).rejects.toMatchObject({
      code: "EVIDENCE_REQUIRED",
      status: 409,
    });

    await addRequiredEvidence(c.id);
    await expect(completeCase(operator, c.id, {}, CORR)).rejects.toMatchObject({
      code: "APPROVAL_REQUIRED",
    });

    const approval = await requestApproval(operator, c.id, { requestedAction: "外部共有の実行" }, CORR);
    await decideApproval(approver, approval.id, { decision: "APPROVED", reason: "戻し方確認済み" }, CORR);

    const completed = await completeCase(operator, c.id, {}, CORR);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.closedAt).not.toBeNull();
  });

  it("拒否と完了がAuditEventへ追記される(AC-019相当)", async () => {
    const c = await createCase(operator, baseCaseInput(), CORR);
    await expect(completeCase(operator, c.id, {}, CORR)).rejects.toBeTruthy();
    const denied = await prisma.auditEvent.findFirst({
      where: { entityId: c.id, action: "CASE_COMPLETE_DENIED", result: "DENIED" },
    });
    expect(denied).not.toBeNull();
    expect(denied?.reasonCode).toBe("EVIDENCE_REQUIRED");
  });
});

describe("R3 emergency containment (AC-013相当)", () => {
  it("承認なし・緊急記録なし→拒否、緊急記録+証跡→完了可(理由が記録される)", async () => {
    const c = await createCase(operator, baseCaseInput({ securitySignal: true }), CORR);
    expect(c.risk).toBe("R3");

    await addRequiredEvidence(c.id);
    await expect(completeCase(operator, c.id, {}, CORR)).rejects.toMatchObject({
      code: "APPROVAL_OR_EMERGENCY_REQUIRED",
    });

    const completed = await completeCase(operator, c.id, {
      emergency: {
        reason: "情報漏えい拡大防止のための即時封じ込め",
        sharedAt: "2026-07-17T16:10:00+09:00",
        minimalActions: "対象アカウントの一時停止のみ",
        postReviewAt: "2026-07-18T10:00:00+09:00",
      },
    }, CORR);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.emergencyReason).toContain("即時封じ込め");

    const audit = await prisma.auditEvent.findFirst({
      where: { entityId: c.id, action: "CASE_COMPLETED" },
    });
    expect(audit?.reasonCode).toBe("EMERGENCY_CONTAINMENT");
  });
});

describe("misc invariants", () => {
  it("PATCHでCOMPLETEDへ直接遷移できない(完了ガードの迂回不可)", async () => {
    const c = await createCase(operator, baseCaseInput(), CORR);
    await expect(updateCaseStatus(operator, c.id, "COMPLETED", CORR)).rejects.toMatchObject({
      code: "USE_COMPLETE_ENDPOINT",
    });
  });

  it("完了済みケースは再完了できない", async () => {
    const c = await createCase(operator, baseCaseInput({ eventTemplateId: "EV-09" }), CORR); // R0
    const completed = await completeCase(operator, c.id, {}, CORR);
    expect(completed.status).toBe("COMPLETED");
    await expect(completeCase(operator, c.id, {}, CORR)).rejects.toMatchObject({ code: "ALREADY_COMPLETED" });
  });

  it("R0/R1は承認なしで完了できる(過剰統制にしない)", async () => {
    const c = await createCase(operator, baseCaseInput({ eventTemplateId: "EV-09" }), CORR);
    expect(c.risk).toBe("R0");
    const completed = await completeCase(operator, c.id, {}, CORR);
    expect(completed.status).toBe("COMPLETED");
  });
});
