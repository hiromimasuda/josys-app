import { describe, expect, it } from "vitest";
import { buildMockAnswer, matchScenarioId } from "@ops/ai";

describe("deterministic AI mock (§8.5 contract subset)", () => {
  it("maps Wi-Fi/network questions to AI-DEMO-001 deterministically", () => {
    expect(matchScenarioId("全社のWi-Fiがつながらない")).toBe("AI-DEMO-001");
    expect(matchScenarioId("ネットワーク障害です")).toBe("AI-DEMO-001");
    expect(matchScenarioId("wifi down")).toBe("AI-DEMO-001");
  });

  it("falls back to unknown-problem flow (AI-DEMO-002) otherwise", () => {
    expect(matchScenarioId("見たことがないSaaSのエラー")).toBe("AI-DEMO-002");
    expect(matchScenarioId("プリンタが動かない")).toBe("AI-DEMO-002");
  });

  it("same input always returns same answer", () => {
    const a = buildMockAnswer("全社のWi-Fiがつながらない");
    const b = buildMockAnswer("全社のWi-Fiがつながらない");
    expect(a).toEqual(b);
  });

  it("known scenario cites internal runbook and separates general guidance", () => {
    const a = buildMockAnswer("全社のWi-Fiがつながらない");
    expect(a.answerType).toBe("MIXED");
    expect(a.internalPolicy.conclusion).toBeTruthy();
    expect(a.internalPolicy.sources.map((s) => s.sourceId)).toContain("SRC-DEMO-RUNBOOK");
    expect(a.generalGuidance.applicabilityToCompany).toBe("NEEDS_CONFIRMATION");
    expect(a.actionExecutionAllowed).toBe(false);
  });

  it("unknown scenario returns GENERAL_ONLY without internal conclusion or citations", () => {
    const a = buildMockAnswer("見たことがないSaaSのエラー");
    expect(a.answerType).toBe("GENERAL_ONLY");
    expect(a.internalPolicy.conclusion).toBeNull();
    expect(a.internalPolicy.confidence).toBe("NONE");
    expect(a.internalPolicy.sources).toEqual([]);
    expect(a.uncertainties.join(" ")).toContain("要確認");
  });

  it("never guesses per-row operational priority (urgency stays null)", () => {
    expect(buildMockAnswer("全社のWi-Fiがつながらない").urgency).toBeNull();
    expect(buildMockAnswer("何かのエラー").urgency).toBeNull();
  });

  it("always forbids secret input and destructive actions in doNotDo", () => {
    const a = buildMockAnswer("パスワードを忘れた");
    expect(a.doNotDo.join(" ")).toContain("パスワード");
    expect(a.doNotDo.join(" ")).toContain("承認前");
  });
});
