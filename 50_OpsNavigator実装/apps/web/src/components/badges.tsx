import clsx from "clsx";
import type { FactStatus, OperationalPriority, Risk, CaseStatus } from "@ops/domain";

// §12.2: 状態を色だけで表現しない。全バッジに日本語ラベルを含める。
const base =
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap";

export function PriorityBadge({ priority }: { priority: OperationalPriority | null }) {
  if (priority === null) {
    return (
      <span className={clsx(base, "border-dashed border-slate-400 bg-white text-slate-600")}>
        優先度 要確認
      </span>
    );
  }
  const styles: Record<OperationalPriority, string> = {
    A0: "border-red-300 bg-red-50 text-red-800",
    A1: "border-amber-300 bg-amber-50 text-amber-900",
    B: "border-slate-300 bg-slate-100 text-slate-700",
    C: "border-blue-200 bg-blue-50 text-blue-800",
    D: "border-slate-300 bg-white text-slate-500",
  };
  const labels: Record<OperationalPriority, string> = {
    A0: "A0 即応必須",
    A1: "A1 期限必須",
    B: "B 最低限定期",
    C: "C 改善・投資",
    D: "D 一旦休止可",
  };
  return <span className={clsx(base, styles[priority])}>{labels[priority]}</span>;
}

export function RiskBadge({ risk }: { risk: Risk }) {
  const styles: Record<Risk, string> = {
    R0: "border-slate-300 bg-slate-100 text-slate-700",
    R1: "border-amber-300 bg-amber-50 text-amber-900",
    R2: "border-purple-300 bg-purple-50 text-purple-900",
    R3: "border-red-400 bg-red-100 text-red-900",
  };
  const labels: Record<Risk, string> = {
    R0: "R0 標準",
    R1: "R1 要確認",
    R2: "R2 高リスク・承認必須",
    R3: "R3 緊急封じ込め",
  };
  return <span className={clsx(base, styles[risk])}>{labels[risk]}</span>;
}

export function FactStatusBadge({ status }: { status: FactStatus }) {
  const styles: Record<FactStatus, string> = {
    CONFIRMED: "border-blue-200 bg-blue-50 text-blue-800",
    PROPOSED: "border-dashed border-slate-400 bg-white text-slate-600",
    NEEDS_CONFIRMATION: "border-amber-300 bg-amber-50 text-amber-900",
    CONFLICTING: "border-red-300 bg-red-50 text-red-800",
  };
  const labels: Record<FactStatus, string> = {
    CONFIRMED: "確定",
    PROPOSED: "提案(PROPOSED)",
    NEEDS_CONFIRMATION: "要確認",
    CONFLICTING: "要突合(競合)",
  };
  return <span className={clsx(base, styles[status])}>{labels[status]}</span>;
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const styles: Record<CaseStatus, string> = {
    OPEN: "border-blue-200 bg-blue-50 text-blue-800",
    IN_PROGRESS: "border-blue-300 bg-blue-100 text-blue-900",
    WAITING_APPROVAL: "border-purple-300 bg-purple-50 text-purple-900",
    BLOCKED: "border-red-300 bg-red-50 text-red-800",
    COMPLETED: "border-green-300 bg-green-50 text-green-900",
  };
  const labels: Record<CaseStatus, string> = {
    OPEN: "受付",
    IN_PROGRESS: "対応中",
    WAITING_APPROVAL: "承認待ち",
    BLOCKED: "保留(要判断)",
    COMPLETED: "完了",
  };
  return <span className={clsx(base, styles[status])}>{labels[status]}</span>;
}

export function AuthorityBadge({ authority }: { authority: string }) {
  const labels: Record<string, string> = {
    AUTHORITATIVE_POLICY: "正本(方針)",
    AUTHORITATIVE_RUNBOOK: "正本(Runbook)",
    DECISION_RECORD: "決定記録",
    EVIDENCE: "証跡",
    BROWSE_VIEW: "閲覧面",
    REFERENCE: "参考",
    AUDIT_ONLY: "監査限定",
  };
  return (
    <span className={clsx(base, "border-slate-300 bg-white text-slate-600")}>
      {labels[authority] ?? authority}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className={clsx(base, "border-slate-400 bg-slate-800 text-white")} title="合成デモデータ">
      DEMO
    </span>
  );
}

export function GeneralGuidanceBadge() {
  return (
    <span className={clsx(base, "border-amber-300 bg-amber-50 text-amber-900")}>
      一般的推奨・社内適用は要確認
    </span>
  );
}
