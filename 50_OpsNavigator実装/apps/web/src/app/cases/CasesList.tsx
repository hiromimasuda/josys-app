"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { eventById, formatJst, seed } from "@ops/domain";
import { CaseStatusBadge, DemoBadge, PriorityBadge, RiskBadge } from "@/components/badges";
import { loadLocalCases, type LocalCase } from "@/lib/localCases";

export function CasesList() {
  const [localCases, setLocalCases] = useState<LocalCase[]>([]);
  useEffect(() => {
    setLocalCases(loadLocalCases());
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">ケース</h1>
        <Link
          href="/cases/new"
          className="tap inline-flex items-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-bold text-white hover:bg-blue-900"
        >
          新規ケース作成
        </Link>
      </div>

      <ul className="space-y-2">
        {seed.demoCases.map((c) => (
          <li key={c.id}>
            <Link
              href={`/cases/${c.id}`}
              className="tap flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50/40"
            >
              <span className="font-semibold">{c.title}</span>
              <PriorityBadge priority={c.operationalPriority} />
              <RiskBadge risk={c.risk} />
              <CaseStatusBadge status={c.status} />
              <span className="text-xs text-slate-500">期限 {formatJst(c.dueAt)}</span>
              <DemoBadge />
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="text-base font-bold">ローカル下書き(この端末のみ・DEMO)</h2>
      {localCases.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
          ローカル下書きはありません。「新規ケース作成」から作成できます(Gate 1ではこの端末のlocalStorageにのみ保存されます)。
        </p>
      ) : (
        <ul className="space-y-2">
          {localCases.map((c) => {
            const ev = eventById.get(c.eventTemplateId);
            return (
              <li key={c.id}>
                <details className="rounded-lg border border-slate-200 bg-white p-3">
                  <summary className="tap cursor-pointer font-semibold">
                    {c.id}: {ev?.name ?? c.eventTemplateId}(下書き)
                  </summary>
                  <dl className="mt-2 grid gap-1 text-sm">
                    <div><dt className="inline font-medium">発生時刻: </dt><dd className="inline">{formatJst(c.occurredAt)}</dd></div>
                    <div><dt className="inline font-medium">影響対象: </dt><dd className="inline">{c.impactTarget}</dd></div>
                    <div><dt className="inline font-medium">影響範囲: </dt><dd className="inline">{c.impactScope}</dd></div>
                    <div><dt className="inline font-medium">継続中: </dt><dd className="inline">{c.ongoing ? "はい" : "いいえ"}</dd></div>
                    <div><dt className="inline font-medium">直前の変更: </dt><dd className="inline">{c.recentChange ? "あり" : "なし"}</dd></div>
                    <div><dt className="inline font-medium">セキュリティ兆候: </dt><dd className="inline">{c.securitySignal ? "あり" : "なし"}</dd></div>
                    {c.summary && (
                      <div><dt className="inline font-medium">概要: </dt><dd className="inline">{c.summary}</dd></div>
                    )}
                  </dl>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
