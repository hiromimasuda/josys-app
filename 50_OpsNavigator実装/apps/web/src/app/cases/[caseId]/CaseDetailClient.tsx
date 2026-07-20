"use client";
// §5.5 ケース詳細(Gate 2: DB/API接続)。
// 完了・承認・証跡はすべてサーバー側で検証され、UI操作はそれを表示するだけ。
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatJst } from "@ops/domain";
import { CaseStatusBadge, FactStatusBadge, PriorityBadge, RiskBadge } from "@/components/badges";
import { EmptyState, Section } from "@/components/Section";
import { api, describeError } from "@/lib/api";

interface CaseDetail {
  id: string;
  title: string;
  priority: "A0" | "A1" | "B" | "C" | "D";
  risk: "R0" | "R1" | "R2" | "R3";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_APPROVAL" | "BLOCKED" | "COMPLETED";
  summarySanitized: string;
  impactScope: string;
  ongoing: boolean;
  securitySignal: boolean;
  dueAt: string | null;
  closedAt: string | null;
  emergencyReason: string | null;
  operationIds: string[];
  factStatus: "CONFIRMED" | "PROPOSED" | "NEEDS_CONFIRMATION" | "CONFLICTING";
  eventTemplate: { id: string; name: string; riskNote: string | null } | null;
  assignee: { displayName: string } | null;
  workItems: { id: string; title: string; status: string }[];
  approvals: {
    id: string;
    risk: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    requestedAction: string;
    decisionReason: string | null;
  }[];
  evidence: { id: string; kind: string; uri: string; description: string; capturedAt: string }[];
  exceptions: {
    id: string; reason: string; dueAt: string; nextReviewAt: string; fallback: string; status: string;
  }[];
}

const EVIDENCE_KINDS = [
  ["BEFORE", "実行前"],
  ["AFTER", "実行後"],
  ["USER_CONFIRMATION", "本人確認"],
  ["APPROVAL", "承認記録"],
  ["ROLLBACK_TEST", "戻し方確認"],
  ["AUDIT_NOTE", "監査メモ"],
] as const;

export function CaseDetailClient({ caseId }: { caseId: string }) {
  const [c, setCase] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [evidenceKind, setEvidenceKind] = useState<string>("BEFORE");

  const reload = useCallback(() => {
    api<CaseDetail>(`/api/v1/cases/${caseId}`)
      .then((data) => {
        setCase(data);
        setError(null);
      })
      .catch((e) => setError(describeError(e)));
  }, [caseId]);

  useEffect(reload, [reload]);

  const act = async (fn: () => Promise<unknown>, successMessage: string) => {
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(successMessage);
      reload();
    } catch (e) {
      setError(describeError(e));
    }
  };

  if (!c) {
    return (
      <div className="space-y-3">
        {error ? (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>
        ) : (
          <p className="text-sm text-slate-500">読み込み中…</p>
        )}
      </div>
    );
  }

  const highRisk = c.risk === "R2" || c.risk === "R3";
  const isConflictCase = c.factStatus === "CONFLICTING";

  return (
    <div className="space-y-4">
      <nav aria-label="パンくず" className="text-xs text-slate-500">
        <Link href="/cases" className="underline">ケース</Link> / {c.id}
      </nav>

      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold">{c.title}</h1>
          <PriorityBadge priority={c.priority} />
          <RiskBadge risk={c.risk} />
          <CaseStatusBadge status={c.status} />
        </div>
        <p className="mt-1 text-xs text-slate-600">
          担当: {c.assignee?.displayName ?? "未割当"} /
          期限: {c.dueAt ? formatJst(c.dueAt) : "-"} /
          入口: {c.eventTemplate?.name ?? "-"} / 影響範囲: {c.impactScope}
        </p>
        {c.summarySanitized && <p className="mt-1 text-sm text-slate-700">{c.summarySanitized}</p>}
      </div>

      {error && (
        <p role="alert" data-testid="case-error" className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm font-semibold text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-green-400 bg-green-50 p-3 text-sm font-semibold text-green-900">
          {notice}
        </p>
      )}

      {highRisk && c.status !== "COMPLETED" && (
        <p className="rounded-lg border border-purple-400 bg-purple-50 p-3 text-sm font-semibold text-purple-900">
          {c.risk === "R3"
            ? "R3: 承認または緊急封じ込め記録、および実行前・実行後・本人確認の証跡がないと完了できません(サーバー側で拒否)。"
            : "R2: 実行前承認と、実行前・実行後・本人確認の証跡がないと完了できません(サーバー側で拒否)。"}
        </p>
      )}

      {isConflictCase && (
        <p className="rounded-lg border border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-900">
          要突合: このケースの根拠となる正本が競合しています。どちらか一方を確定として扱わないでください。
        </p>
      )}

      {c.emergencyReason && (
        <p className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
          緊急封じ込め記録: {c.emergencyReason}
        </p>
      )}

      <Section title="操作(サーバー側で検証されます)" tone="blue">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="tap rounded-lg bg-blue-800 px-3 py-2 text-sm font-bold text-white hover:bg-blue-900"
            onClick={() =>
              act(
                () => api(`/api/v1/cases/${c.id}/approvals`, {
                  method: "POST",
                  body: JSON.stringify({ requestedAction: `${c.title} の実行承認` }),
                }),
                "承認を依頼しました(承認者ユーザーへ切替えて判断できます)。",
              )
            }
          >
            承認を依頼
          </button>
          <span className="flex items-center gap-1">
            <label htmlFor="evkind" className="text-xs text-slate-600">証跡種別</label>
            <select
              id="evkind"
              className="tap rounded-md border border-slate-300 px-2 py-1 text-sm"
              value={evidenceKind}
              onChange={(e) => setEvidenceKind(e.target.value)}
            >
              {EVIDENCE_KINDS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              type="button"
              className="tap rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900 hover:bg-blue-100"
              onClick={() =>
                act(
                  () => api(`/api/v1/cases/${c.id}/evidence`, {
                    method: "POST",
                    body: JSON.stringify({
                      kind: evidenceKind,
                      uri: `https://evidence.example.invalid/${c.id.toLowerCase()}/${evidenceKind.toLowerCase()}`,
                      description: "DEMO証跡ポインタ",
                    }),
                  }),
                  "証跡を追加しました。",
                )
              }
            >
              証跡を追加
            </button>
          </span>
          <button
            type="button"
            data-testid="complete-button"
            className="tap rounded-lg bg-green-700 px-3 py-2 text-sm font-bold text-white hover:bg-green-800"
            onClick={() => act(() => api(`/api/v1/cases/${c.id}/complete`, { method: "POST", body: "{}" }), "ケースを完了しました。")}
          >
            完了にする
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          完了はサーバー側の不変条件(§7.4)で検証されます。R2/R3で条件を満たさない場合は拒否され、その理由が表示されます。
        </p>
      </Section>

      <Section title="承認" tone="purple">
        {c.approvals.length === 0 ? (
          <EmptyState>承認依頼はまだありません。</EmptyState>
        ) : (
          <ul className="space-y-2 text-sm">
            {c.approvals.map((a) => (
              <li key={a.id} className="rounded-lg border border-purple-200 p-2">
                <span className="mr-2 font-medium">{a.requestedAction}</span>
                <span>
                  状態: {a.status === "PENDING" ? "承認待ち" : a.status === "APPROVED" ? "承認済み" : "却下"}
                </span>
                {a.decisionReason && <span className="block text-xs text-slate-500">理由: {a.decisionReason}</span>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          承認の判断は<Link className="text-blue-800 underline" href="/approvals">承認・例外</Link>から(承認者ロールのみ。サーバー側で強制)。
        </p>
      </Section>

      <Section title="証跡">
        {c.evidence.length === 0 ? (
          <EmptyState>
            証跡はまだ登録されていません。{highRisk && "R2/R3は実行前・実行後・本人確認の証跡が必須です。"}
          </EmptyState>
        ) : (
          <ul className="space-y-2 text-sm" data-testid="evidence-list">
            {c.evidence.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-200 p-2">
                <span className="font-medium">{e.kind}</span> — {formatJst(e.capturedAt)}
                <div className="text-xs text-slate-500">
                  <code>{e.uri}</code>(表示のみ・外部取得しません)
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="作業項目(WorkItem)">
        {c.workItems.length === 0 ? (
          <EmptyState>作業項目はありません。</EmptyState>
        ) : (
          <ul className="space-y-1 text-sm">
            {c.workItems.map((w) => (
              <li key={w.id} className="flex items-center gap-2">
                <span className={w.status === "DONE" ? "text-green-800" : "text-slate-700"}>
                  [{w.status}] {w.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="関連業務">
        <ul className="space-y-1">
          {c.operationIds.map((opId) => (
            <li key={opId}>
              <Link href={`/operations/${opId}`} className="tap inline-flex items-center gap-1 text-sm text-blue-800 underline">
                {opId}
              </Link>
            </li>
          ))}
        </ul>
        {c.eventTemplate && (
          <p className="mt-2 text-xs text-slate-500">
            <FactStatusBadge status="PROPOSED" /> 入口との対応付けは提案(PROPOSED)です。
          </p>
        )}
      </Section>

      {c.exceptions.length > 0 && (
        <Section title="例外(期限付き代替統制)" tone="amber">
          <ul className="space-y-2 text-sm">
            {c.exceptions.map((x) => (
              <li key={x.id} className="rounded-lg border border-amber-200 p-3">
                <p className="font-medium">{x.reason}</p>
                <p className="text-xs text-slate-600">
                  期限: {formatJst(x.dueAt)} / 次回確認: {formatJst(x.nextReviewAt)} / 状態: {x.status}
                </p>
                <p className="text-xs text-slate-600">代替策: {x.fallback}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
