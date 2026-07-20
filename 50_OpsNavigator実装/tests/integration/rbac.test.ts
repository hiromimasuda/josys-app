// RBACのサーバー側強制(03C)。UIを介さずサービス層を直接呼んで検証する。
import { describe, expect, it, beforeAll } from "vitest";
import type { DemoUser } from "@ops/db";
import { ApiError } from "@/server/errors";
import { createCase, decideApproval, requestApproval, updateCaseStatus } from "@/server/services/caseService";
import { reviewCandidate, createCandidate } from "@/server/services/knowledgeService";
import { searchKnowledge } from "@/server/services/searchService";
import { CORR, USERS, baseCaseInput, getUser } from "./helpers";

let employee: DemoUser;
let operator: DemoUser;
let approver: DemoUser;
let knowledgeApprover: DemoUser;

beforeAll(async () => {
  employee = await getUser(USERS.employee);
  operator = await getUser(USERS.operator);
  approver = await getUser(USERS.approver);
  knowledgeApprover = await getUser(USERS.knowledgeApprover);
});

describe("server-side RBAC", () => {
  it("employeeはケースの状態を変更できない(403)", async () => {
    const c = await createCase(operator, baseCaseInput(), CORR);
    await expect(updateCaseStatus(employee, c.id, "IN_PROGRESS", CORR)).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("承認判断はapprover以外拒否される(AC-018相当)", async () => {
    const c = await createCase(operator, baseCaseInput(), CORR);
    const approval = await requestApproval(operator, c.id, { requestedAction: "テスト承認" }, CORR);
    await expect(
      decideApproval(operator, approval.id, { decision: "APPROVED", reason: "x" }, CORR),
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    const decided = await decideApproval(approver, approval.id, { decision: "APPROVED", reason: "確認済み" }, CORR);
    expect(decided.status).toBe("APPROVED");
  });

  it("ナレッジ公開はknowledge_approverのみ(AC-020相当)", async () => {
    const candidate = await createCandidate(operator, { title: "T", content: "C" }, CORR);
    await expect(
      reviewCandidate(operator, candidate.id, { decision: "APPROVED", note: "x" }, CORR),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const reviewed = await reviewCandidate(
      knowledgeApprover, candidate.id, { decision: "APPROVED", note: "ok" }, CORR,
    );
    expect(reviewed.status).toBe("APPROVED");
  });

  it("employeeの検索はRESTRICTED資料をタイトルも含めて返さない(AC-014/016相当)", async () => {
    // 外部共有方針A/BはRESTRICTED
    const asOperator = await searchKnowledge(operator, "外部共有");
    expect(asOperator.length).toBeGreaterThan(0);
    const asEmployee = await searchKnowledge(employee, "外部共有");
    expect(asEmployee).toEqual([]);
  });

  it("employeeでもINTERNAL資料は検索できる", async () => {
    const hits = await searchKnowledge(employee, "ネットワーク");
    expect(hits.some((h) => h.sourceId === "SRC-DEMO-RUNBOOK")).toBe(true);
  });

  it("ApiErrorは§11.4の情報(コード・ステータス)を持つ", async () => {
    try {
      await updateCaseStatus(employee, "CASE-DEMO-001", "IN_PROGRESS", CORR);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe("FORBIDDEN");
    }
  });
});
