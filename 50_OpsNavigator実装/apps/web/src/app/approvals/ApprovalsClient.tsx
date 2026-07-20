"use client";
// 承認・例外(Gate 2: API接続)。承認判断はサーバー側でapproverロールを強制(AC-018相当)。
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RiskBadge } from "@/components/badges";
import { EmptyState, Section } from "@/components/Section";
import { api, describeError } from "@/lib/api";

interface PendingApproval {
  id: string;
  risk: "R0" | "R1" | "R2" | "R3";
  requestedAction: string;
  case: { id: string; title: string };
}

export function ApprovalsClient() {
  const [approvals, setApprovals] = useState<PendingApproval[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(() => {
    api<PendingApproval[]>("/api/v1/approvals")
      .then((data) => {
        setApprovals(data);
        setError(null);
      })
      .catch((e) => setError(describeError(e)));
  }, []);

  useEffect(reload, [reload]);

  const decide = async (id: string, decision: "APPROVED" | "REJECTED") => {
    setError(null);
    setNotice(null);
    try {
      await api(`/api/v1/approvals/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          reason: decision === "APPROVED" ? "内容と戻し方を確認し承認(DEMO)" : "情報不足のため差戻し(DEMO)",
        }),
      });
      setNotice(decision === "APPROVED" ? "承認しました。" : "却下しました。");
      reload();
    } catch (e) {
      setError(describeError(e));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">承認・例外</h1>

      {error && (
        <p role="alert" data-testid="approval-error" className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm font-semibold text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-green-400 bg-green-50 p-3 text-sm font-semibold text-green-900">
          {notice}
        </p>
      )}

      <Section title="承認待ち" tone="purple">
        {approvals === null && !error && <p className="text-sm text-slate-500">読み込み中…</p>}
        {approvals && approvals.length === 0 && <EmptyState>承認待ちはありません。</EmptyState>}
        {approvals && approvals.length > 0 && (
          <ul className="space-y-2">
            {approvals.map((a) => (
              <li key={a.id} className="rounded-lg border border-purple-200 bg-white p-3">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/cases/${a.case.id}`} className="font-semibold text-blue-900 underline">
                    {a.case.title}
                  </Link>
                  <RiskBadge risk={a.risk} />
                </p>
                <p className="mt-1 text-xs text-slate-600">{a.requestedAction}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="tap rounded-lg bg-purple-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-purple-800"
                    onClick={() => decide(a.id, "APPROVED")}
                  >
                    承認する
                  </button>
                  <button
                    type="button"
                    className="tap rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-bold text-purple-900 hover:bg-purple-50"
                    onClick={() => decide(a.id, "REJECTED")}
                  >
                    却下する
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          判断は承認者ロールのみ実行できます(他ロールで押すとサーバーが403で拒否します)。
        </p>
      </Section>
    </div>
  );
}
