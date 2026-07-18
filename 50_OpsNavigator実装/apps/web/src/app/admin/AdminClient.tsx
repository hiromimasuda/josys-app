"use client";
import Link from "next/link";
import { seed, seedValidation } from "@ops/domain";
import { useMockUser } from "@/lib/mockAuth";
import { EmptyState, Section } from "@/components/Section";

// 管理画面(Gate 1: UI側のロール制御のみ。API/サーバー側強制はGate 2で実装)
export function AdminClient() {
  const [user] = useMockUser();
  const isAdmin = user.roleIds.includes("admin");

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">管理</h1>
        <p
          role="alert"
          className="rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-700"
        >
          この画面を表示する権限がありません(現在のDEMOユーザー: {user.displayName})。
          必要な場合は管理者へ依頼してください。管理情報はここには表示されません。
        </p>
        <p className="text-xs text-slate-500">
          <Link href="/home" className="text-blue-800 underline">ホームへ戻る</Link> /
          ヘッダーのDEMOユーザー切替でDEMO_ADMINを選ぶと表示を確認できます(mock auth)。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">管理(メタデータのみ)</h1>
      <Section title="データバンドル">
        <ul className="list-disc pl-5 text-sm">
          <li>bundle: {seed.metadata.bundleId} v{seed.metadata.version}(asOf {seed.metadata.asOf})</li>
          <li>
            件数: {seedValidation.counts.flows}フロー / {seedValidation.counts.operations}業務 /{" "}
            {seedValidation.counts.eventTemplates}入口 / 検証エラー {seedValidation.errors.length}件
          </li>
          <li>syntheticOnly / demoOnly: true(本番seed投入は不可)</li>
        </ul>
      </Section>
      <Section title="ユーザー・同期・設定">
        <EmptyState>
          ユーザー管理、SourceRegistry同期、設定変更はGate 2以降で実装します。本番接続はGate 3の承認が必要です。
        </EmptyState>
      </Section>
    </div>
  );
}
