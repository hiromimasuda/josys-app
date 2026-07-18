// §8.5 AI回答契約のGate 1サブセット。§5.9の固定表示順9項目をUIが描画できる形にする。
import type { OperationalPriority, Risk } from "@ops/domain";

export type AnswerType =
  | "INTERNAL_CONFIRMED"
  | "MIXED"
  | "GENERAL_ONLY"
  | "CANNOT_ANSWER"
  | "URGENT_ESCALATION";

export interface AnswerCitation {
  sourceId: string;
  title: string;
  uri: string; // example.invalid のみ。表示専用でfetch/リンク化しない
  authority: string;
  status: string;
}

export interface StructuredMockAnswer {
  answerType: AnswerType;
  scenarioId: string; // 採用したaiMockResponsesのID(決定論性の証跡)
  urgency: OperationalPriority | null; // nullは「要確認」。推測で埋めない
  risk: Risk;
  firstActions: { action: string; reason: string; safeWithoutApproval: boolean }[];
  doNotDo: string[];
  internalPolicy: {
    conclusion: string | null;
    confidence: "HIGH" | "MEDIUM" | "LOW" | "NONE";
    sources: AnswerCitation[];
  };
  generalGuidance: {
    recommendation: string | null;
    applicabilityToCompany: "CONFIRMED" | "PROPOSED" | "NEEDS_CONFIRMATION";
  };
  approval: { required: boolean; approverRole: string | null; reason: string | null };
  evidenceRequired: string[];
  rollbackOrFallback: string | null;
  escalation: { condition: string | null; destinationRole: string | null };
  uncertainties: string[];
  updatedAtLabel: string;
  actionExecutionAllowed: false;
}
