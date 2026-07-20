"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatJst } from "@ops/domain";
import { CaseStatusBadge, DemoBadge, PriorityBadge, RiskBadge } from "@/components/badges";
import { api, describeError } from "@/lib/api";

interface CaseRow {
  id: string;
  title: string;
  priority: "A0" | "A1" | "B" | "C" | "D";
  risk: "R0" | "R1" | "R2" | "R3";
  status: "OPEN" | "IN_PROGRESS" | "WAITING_APPROVAL" | "BLOCKED" | "COMPLETED";
  dueAt: string | null;
  demoOnly: boolean;
}

export function CasesList() {
  const [cases, setCases] = useState<CaseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CaseRow[]>("/api/v1/cases")
      .then(setCases)
      .catch((e) => setError(describeError(e)));
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

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}
      {cases === null && !error && <p className="text-sm text-slate-500">読み込み中…</p>}

      {cases && (
        <ul className="space-y-2" data-testid="case-list">
          {cases.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cases/${c.id}`}
                className="tap flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50/40"
              >
                <span className="font-semibold">{c.title}</span>
                <PriorityBadge priority={c.priority} />
                <RiskBadge risk={c.risk} />
                <CaseStatusBadge status={c.status} />
                {c.dueAt && <span className="text-xs text-slate-500">期限 {formatJst(c.dueAt)}</span>}
                {c.demoOnly && <DemoBadge />}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {cases && cases.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
          表示できるケースがありません(一般社員は自分が作成した依頼のみ表示されます)。
        </p>
      )}
    </div>
  );
}
