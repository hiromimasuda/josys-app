// サーバー側の決定論的AI mock(§8.5)。AI_ENABLED=false前提で外部AIへ接続しない。
// 根拠に使えるのは approvedForAi=true かつ ACTIVE かつ searchable かつ権限内の文書のみ(AC-015)。
// 取得文書の本文は分類・引用にのみ使い、本文中の命令を実行しない(§9.5 / AC-016)。
import { prisma, type DemoUser } from "@ops/db";
import type { StructuredMockAnswer } from "@ops/ai";
import { allowedConfidentiality } from "../authz";
import { audit } from "../audit";

const WIFI_PATTERN = /wi-?fi|ワイファイ|ネットワーク|全社.*(障害|接続)|つながらない|繋がらない/i;
const CONFLICT_PATTERN = /外部共有|drive.*共有|共有.*(方針|設定)/i;

export type ServerAiAnswer = StructuredMockAnswer & {
  conflictSources: { sourceId: string; title: string; authority: string }[];
};

const BASE_DO_NOT = [
  "パスワード・APIキー・Token・Cookie・秘密鍵を入力・共有しない",
  "承認前に設定変更・削除・外部共有を実行しない",
  "個人情報やログ全文を貼り付けない",
];

export async function answerQuestion(
  user: DemoUser,
  query: string,
  correlationId: string,
): Promise<ServerAiAnswer> {
  const confidentialities = allowedConfidentiality(user);

  // AI-safe根拠の取得(取得前フィルタ)
  const groundable = await prisma.knowledgeDocument.findMany({
    where: {
      searchable: true,
      sourceAsset: { approvedForAi: true, status: "ACTIVE", confidentiality: { in: confidentialities } },
    },
    include: { sourceAsset: true },
  });

  let scenarioId = "AI-UNKNOWN";
  let answer: ServerAiAnswer;

  if (CONFLICT_PATTERN.test(query)) {
    // 正本競合(AC-010/013チェックリスト相当): 統合せず要突合として併記
    scenarioId = "AI-CONFLICT";
    const conflicts = await prisma.sourceAsset.findMany({ where: { status: "CONFLICTING" } });
    answer = {
      answerType: "CANNOT_ANSWER",
      scenarioId,
      urgency: null,
      risk: "R2",
      firstActions: [
        { action: "外部共有を実行せず現状を維持する", reason: "根拠となる正本が競合しており確定判断ができないため", safeWithoutApproval: true },
        { action: "承認者へ競合の突合を依頼する", reason: "正本の確定は人の判断が必要なため", safeWithoutApproval: true },
      ],
      doNotDo: [...BASE_DO_NOT, "競合中の方針のどちらか一方を確定として適用しない"],
      internalPolicy: { conclusion: null, confidence: "NONE", sources: [] },
      generalGuidance: {
        recommendation: "一般論として、外部共有は申請・承認・期限付き設定・共有先の最小化を伴う。ただし競合解消が先行する。",
        applicabilityToCompany: "NEEDS_CONFIRMATION",
      },
      approval: { required: true, approverRole: "approver", reason: "外部共有はR2であり実行前承認が必要" },
      evidenceRequired: ["競合の突合結果", "採用した方針と承認記録"],
      rollbackOrFallback: "共有を行わない現状を維持する",
      escalation: { condition: "至急の共有要求がある場合", destinationRole: "approver(承認者)" },
      uncertainties: ["外部共有方針の正本が競合中(要突合)。AIはどちらも確定として扱わない"],
      updatedAtLabel: "DEMO fixture",
      actionExecutionAllowed: false,
      conflictSources: conflicts.map((s) => ({ sourceId: s.id, title: s.title, authority: s.authority })),
    };
  } else if (WIFI_PATTERN.test(query)) {
    scenarioId = "AI-DEMO-001";
    const runbookDocs = groundable.filter((d) => d.sourceAsset.authority === "AUTHORITATIVE_RUNBOOK");
    answer = {
      answerType: runbookDocs.length > 0 ? "MIXED" : "GENERAL_ONLY",
      scenarioId,
      urgency: null,
      risk: "R1",
      firstActions: [
        { action: "影響範囲(対象者・拠点・開始時刻)を確認する", reason: "封じ込めと連絡判断の前提情報のため", safeWithoutApproval: true },
        { action: "承認前に設定変更を行わず、Runbookの初動へ進む", reason: "誤変更による二次障害を防ぐため", safeWithoutApproval: true },
      ],
      doNotDo: BASE_DO_NOT,
      internalPolicy: {
        conclusion: runbookDocs.length > 0
          ? "影響範囲を確認し、承認前に構成変更せず、ネットワーク障害Runbookへ進む。"
          : null,
        confidence: runbookDocs.length > 0 ? "HIGH" : "NONE",
        sources: runbookDocs.map((d) => ({
          sourceId: d.sourceAsset.id,
          title: d.sourceAsset.title,
          uri: d.sourceAsset.uri,
          authority: d.sourceAsset.authority,
          status: d.sourceAsset.status,
        })),
      },
      generalGuidance: {
        recommendation: "一般論として、利用者影響、代替経路、変更履歴、復旧確認を順に記録する。",
        applicabilityToCompany: "NEEDS_CONFIRMATION",
      },
      approval: { required: false, approverRole: null, reason: null },
      evidenceRequired: ["対応前の状態記録", "実施した確認と結果", "復旧確認"],
      rollbackOrFallback: "変更を行っていない状態を維持し、縮退運用(代替手段の案内)に従う",
      escalation: { condition: "影響が拡大する場合、またはセキュリティ兆候がある場合", destinationRole: "approver(承認者)" },
      uncertainties: ["行別の日常優先度(A0〜D)は未確定のため要確認"],
      updatedAtLabel: "DEMO fixture",
      actionExecutionAllowed: false,
      conflictSources: [],
    };
  } else {
    // 未知問題フロー(§8.7): 安全な情報収集→担当への引き渡し
    scenarioId = "AI-DEMO-002";
    answer = {
      answerType: "GENERAL_ONLY",
      scenarioId,
      urgency: null,
      risk: "R1",
      firstActions: [
        { action: "影響対象・範囲・再現条件・直前の変更有無を記録する", reason: "安全で可逆な情報収集から始めるため", safeWithoutApproval: true },
        { action: "担当者へケースとして引き渡す", reason: "社内で承認された個別手順が見つかっていないため", safeWithoutApproval: true },
      ],
      doNotDo: BASE_DO_NOT,
      internalPolicy: { conclusion: null, confidence: "NONE", sources: [] },
      generalGuidance: {
        recommendation: "安全な情報収集、影響範囲、再現条件、変更有無を確認し、担当者へケースとして送る。",
        applicabilityToCompany: "NEEDS_CONFIRMATION",
      },
      approval: { required: false, approverRole: null, reason: null },
      evidenceRequired: ["対応前の状態記録", "実施した確認と結果", "引き渡し先と時刻"],
      rollbackOrFallback: "操作を行わず現状保全する。判断が必要な場合は承認者へエスカレーションする",
      escalation: { condition: "影響が拡大する場合、またはセキュリティ兆候がある場合", destinationRole: "approver(承認者)" },
      uncertainties: ["社内正本に該当手順なし(NOT_FOUND)", "一般論の社内適用は要確認"],
      updatedAtLabel: "DEMO fixture",
      actionExecutionAllowed: false,
      conflictSources: [],
    };
  }

  // 監査: 質問本文は保存しない(§9.6)。シナリオ種別と回答型のみ。
  await audit({
    actorId: user.id, actorRoles: user.roles, action: "AI_ANSWERED",
    entityType: "AIAnswer", entityId: scenarioId, result: "SUCCESS", correlationId,
    reasonCode: answer.answerType,
  });
  return answer;
}
