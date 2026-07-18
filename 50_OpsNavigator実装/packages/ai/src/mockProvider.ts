// 決定論的AI mock。外部通信なし・APIキー不要(CLAUDE.md実装境界)。
// 質問文をキーワード規則でaiMockResponses(fixture)へ写像する。同じ入力は常に同じ回答。
import { seed, sourceById } from "@ops/domain";
import type { StructuredMockAnswer } from "./contract";

const WIFI_PATTERN = /wi-?fi|ワイファイ|ネットワーク|全社.*(障害|接続)|つながらない|繋がらない/i;

export function matchScenarioId(query: string): string {
  // AI-DEMO-001: 全社Wi-Fi障害 / AI-DEMO-002: 未知のSaaSエラー(既定=未知問題フロー §8.7)
  return WIFI_PATTERN.test(query) ? "AI-DEMO-001" : "AI-DEMO-002";
}

export function buildMockAnswer(query: string): StructuredMockAnswer {
  const scenarioId = matchScenarioId(query);
  const mock = seed.aiMockResponses.find((r) => r.id === scenarioId);
  if (!mock) throw new Error(`unknown mock scenario: ${scenarioId}`);

  const citations = mock.citationSourceIds
    .map((id) => sourceById.get(id))
    .filter((s) => s !== undefined)
    .map((s) => ({
      sourceId: s.id,
      title: s.title,
      uri: s.uri,
      authority: s.authority,
      status: s.status,
    }));

  const found = mock.internalAnswerStatus === "FOUND";

  return {
    answerType: found ? "MIXED" : "GENERAL_ONLY",
    scenarioId,
    // 行別優先度は未確定(NEEDS_CONFIRMATION)のため断定しない。
    urgency: null,
    risk: "R1",
    firstActions: found
      ? [
          {
            action: "影響範囲(対象者・拠点・開始時刻)を確認する",
            reason: "封じ込めと連絡判断の前提情報のため",
            safeWithoutApproval: true,
          },
          {
            action: "承認前に設定変更を行わず、Runbookの初動へ進む",
            reason: "誤変更による二次障害を防ぐため",
            safeWithoutApproval: true,
          },
        ]
      : [
          {
            action: "影響対象・範囲・再現条件・直前の変更有無を記録する",
            reason: "安全で可逆な情報収集から始めるため(§8.7)",
            safeWithoutApproval: true,
          },
          {
            action: "担当者へケースとして引き渡す",
            reason: "社内で承認された個別手順が見つかっていないため",
            safeWithoutApproval: true,
          },
        ],
    doNotDo: [
      "パスワード・APIキー・Token・Cookie・秘密鍵を入力・共有しない",
      "承認前に設定変更・削除・外部共有を実行しない",
      "個人情報やログ全文を貼り付けない",
    ],
    internalPolicy: {
      conclusion: found ? mock.internalAnswer : null,
      confidence: found ? mock.confidence : "NONE",
      sources: citations,
    },
    generalGuidance: {
      recommendation: mock.generalGuidance,
      applicabilityToCompany: "NEEDS_CONFIRMATION",
    },
    approval: found
      ? { required: false, approverRole: null, reason: null }
      : { required: false, approverRole: null, reason: null },
    evidenceRequired: ["対応前の状態記録", "実施した確認と結果", "引き渡し先と時刻"],
    rollbackOrFallback: found
      ? "変更を行っていない状態を維持し、Runbookの縮退運用(代替手段の案内)に従う"
      : "操作を行わず現状保全する。判断が必要な場合は承認者へエスカレーションする",
    escalation: {
      condition: mock.escalationRequired ? "影響が拡大する場合、またはセキュリティ兆候がある場合" : null,
      destinationRole: mock.escalationRequired ? "approver(承認者)" : null,
    },
    uncertainties: found
      ? ["行別の日常優先度(A0〜D)は未確定のため要確認"]
      : ["社内正本に該当手順なし(NOT_FOUND)", "一般論の社内適用は要確認"],
    updatedAtLabel: `fixture asOf ${seed.metadata.asOf}`,
    actionExecutionAllowed: false,
  };
}
