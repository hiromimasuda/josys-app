"use client";
// 管理画面(Gate 2): メタデータはAPI経由で取得し、非adminはサーバー側で403(AC-022相当)。
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api";
import { api, describeError } from "@/lib/api";
import { useMockUser } from "@/lib/mockAuth";
import { EmptyState, Section } from "@/components/Section";

interface AdminSummary {
  flows: number;
  operations: number;
  eventTemplates: number;
  users: number;
  cases: number;
  auditEvents: number;
  aiEnabled: boolean;
  externalWritesEnabled: boolean;
}

export function AdminClient() {
  const [user] = useMockUser();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setSummary(null);
    setDenied(false);
    setError(null);
    api<AdminSummary>("/api/v1/admin/summary")
      .then(setSummary)
      .catch((e) => {
        if (e instanceof ApiClientError && e.status === 403) setDenied(true);
        else setError(describeError(e));
      });
  }, []);

  useEffect(load, [load, user.id]);

  if (denied) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">管理</h1>
        <p role="alert" data-testid="admin-denied" className="rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-700">
          この画面を表示する権限がありません(サーバーが403を返しました。現在のDEMOユーザー: {user.displayName})。
          必要な場合は管理者へ依頼してください。管理情報はここには表示されません。
        </p>
        <p className="text-xs text-slate-500">
          <Link href="/home" className="text-blue-800 underline">ホームへ戻る</Link> /
          ヘッダーのDEMOユーザー切替でDEMO_ADMINを選ぶと表示できます(mock auth)。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">管理(メタデータのみ)</h1>
      {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      {!summary && !error && <p className="text-sm text-slate-500">読み込み中…</p>}
      {summary && (
        <Section title="DEMO DBメタデータ">
          <ul className="list-disc pl-5 text-sm" data-testid="admin-summary">
            <li>件数: {summary.flows}フロー / {summary.operations}業務 / {summary.eventTemplates}入口</li>
            <li>DEMOユーザー: {summary.users} / ケース: {summary.cases} / 監査イベント: {summary.auditEvents}</li>
            <li>AI_ENABLED: {String(summary.aiEnabled)}(外部AI未接続・mockのみ)</li>
            <li>EXTERNAL_WRITES_ENABLED: {String(summary.externalWritesEnabled)}(Action Runner無効)</li>
          </ul>
        </Section>
      )}
      <Section title="ユーザー・同期・設定">
        <EmptyState>
          ユーザー管理、SourceRegistry同期、設定変更はGate 3以降の承認後に実装します。
        </EmptyState>
      </Section>
    </div>
  );
}
