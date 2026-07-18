"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { flowsOrdered, seed } from "@ops/domain";
import { FactStatusBadge, PriorityBadge } from "@/components/badges";

// §5.6 業務43一覧。初任者モード(既定ON)では操作対象(DEMOケース関連)だけを表示する。
export function OperationsExplorer() {
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [flowFilter, setFlowFilter] = useState("");
  const [query, setQuery] = useState("");

  const activeOperationIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of seed.demoCases) for (const id of c.operationIds) ids.add(id);
    for (const s of seed.scheduleOccurrences) ids.add(s.operationId);
    return ids;
  }, []);

  const filtered = seed.operations.filter((op) => {
    if (beginnerMode && !activeOperationIds.has(op.id)) return false;
    if (flowFilter && op.flowId !== flowFilter) return false;
    if (query && !`${op.id} ${op.name}`.includes(query)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">業務43</h1>
        <p className="text-sm text-slate-600" data-testid="operations-count">
          全{seed.operations.length}件中 {filtered.length}件を表示
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={beginnerMode}
            onChange={(e) => setBeginnerMode(e.target.checked)}
          />
          初任者モード(操作対象の行だけを表示)
        </label>
        <label className="flex items-center gap-2 text-sm">
          フロー
          <select
            className="tap rounded-md border border-slate-300 px-2 py-1"
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value)}
          >
            <option value="">すべて</option>
            {flowsOrdered.map((f) => (
              <option key={f.id} value={f.id}>
                {f.id} {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          検索
          <input
            type="search"
            className="tap rounded-md border border-slate-300 px-2 py-1"
            placeholder="業務名・ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <p className="text-xs text-slate-500">
        行別の日常優先度A0〜Dは正本未同期のため全行「要確認」です(推測表示しません)。
      </p>

      <ul className="grid gap-2">
        {filtered.map((op) => {
          const flow = flowsOrdered.find((f) => f.id === op.flowId);
          return (
            <li key={op.id}>
              <Link
                href={`/operations/${op.id}`}
                className="tap flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-blue-300 hover:bg-blue-50/40"
              >
                <span className="font-mono text-xs text-slate-500">{op.id}</span>
                <span className="font-semibold">{op.name}</span>
                <span className="text-xs text-slate-500">{flow ? `${flow.id} ${flow.name}` : op.flowId}</span>
                <PriorityBadge priority={op.operationalPriority} />
                <FactStatusBadge status={op.factStatus} />
              </Link>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
          条件に一致する業務がありません。初任者モードを解除すると全43件を表示できます。
        </p>
      )}
    </div>
  );
}
