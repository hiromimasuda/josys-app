"use client";
// §5.11 引継ぎ(Gate 2): 受領/差戻しの記録。実動作+証跡なしの「受領」はサーバーが拒否(AC-021相当)。
import { useCallback, useEffect, useState } from "react";
import { formatJst } from "@ops/domain";
import { EmptyState, Section } from "@/components/Section";
import { api, describeError } from "@/lib/api";

interface AcceptanceRow {
  id: string;
  scenario: string;
  operated: boolean;
  evidenceUri: string | null;
  result: "ACCEPTED" | "RETURNED";
  notes: string;
  recordedAt: string;
  performedBy: { displayName: string };
}

export function HandoverClient() {
  const [records, setRecords] = useState<AcceptanceRow[] | null>(null);
  const [scenario, setScenario] = useState("");
  const [operated, setOperated] = useState(false);
  const [withEvidence, setWithEvidence] = useState(false);
  const [result, setResult] = useState<"ACCEPTED" | "RETURNED">("ACCEPTED");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(() => {
    api<AcceptanceRow[]>("/api/v1/acceptance-checks")
      .then(setRecords)
      .catch(() => setRecords(null));
  }, []);

  useEffect(reload, [reload]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await api("/api/v1/acceptance-checks", {
        method: "POST",
        body: JSON.stringify({
          scenario,
          operated,
          evidenceUri: withEvidence ? "https://evidence.example.invalid/handover/walkthrough" : undefined,
          result,
          notes,
        }),
      });
      setNotice("記録しました。");
      setScenario("");
      setNotes("");
      reload();
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">引継ぎ</h1>

      <Section title="習熟段階">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>0〜1か月: 今日の情シス・代表A0/A1・次の30日を一人で回せる</li>
          <li>1〜3か月: 43業務・周期・例外・未確認事項を扱える</li>
          <li>3か月以降: 横断差分・統制・自動化資産・改善へ広げる</li>
        </ul>
      </Section>

      {error && (
        <p role="alert" data-testid="handover-error" className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm font-semibold text-red-900">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-green-400 bg-green-50 p-3 text-sm font-semibold text-green-900">
          {notice}
        </p>
      )}

      <Section title="No-Masudaテストの記録(受領/差戻し)" tone="blue">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="scenario" className="mb-1 block text-sm font-semibold">シナリオ</label>
            <input
              id="scenario"
              className="tap w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="例: 全社Wi-Fi障害の初動を実施できる"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="tap flex items-center gap-2">
              <input type="checkbox" className="h-5 w-5" checked={operated} onChange={(e) => setOperated(e.target.checked)} />
              実動作を実施した
            </label>
            <label className="tap flex items-center gap-2">
              <input type="checkbox" className="h-5 w-5" checked={withEvidence} onChange={(e) => setWithEvidence(e.target.checked)} />
              証跡リンクあり(DEMOポインタ)
            </label>
            <label className="tap flex items-center gap-2">
              判定
              <select
                className="tap rounded-md border border-slate-300 px-2 py-1"
                value={result}
                onChange={(e) => setResult(e.target.value as "ACCEPTED" | "RETURNED")}
              >
                <option value="ACCEPTED">受領</option>
                <option value="RETURNED">差戻し</option>
              </select>
            </label>
          </div>
          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-semibold">メモ(不足・差戻し理由)</label>
            <textarea
              id="notes"
              rows={2}
              className="tap w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button type="submit" className="tap rounded-lg bg-blue-800 px-4 py-2 text-sm font-bold text-white hover:bg-blue-900">
            記録する
          </button>
          <p className="text-xs text-slate-500">
            「受領」は実動作の実施と証跡リンクがない場合、サーバー側で拒否されます(説明のみでは受領不可)。
          </p>
        </form>
      </Section>

      <Section title="記録一覧">
        {records === null && <EmptyState>記録を表示する権限がないか、まだ記録がありません。</EmptyState>}
        {records && records.length === 0 && <EmptyState>記録はまだありません。</EmptyState>}
        {records && records.length > 0 && (
          <ul className="space-y-2 text-sm" data-testid="acceptance-list">
            {records.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.scenario}</span>
                  <span
                    className={
                      r.result === "ACCEPTED"
                        ? "rounded border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-900"
                        : "rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900"
                    }
                  >
                    {r.result === "ACCEPTED" ? "受領" : "差戻し"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  実動作: {r.operated ? "あり" : "なし"} / 証跡: {r.evidenceUri ? "あり" : "なし"} /
                  記録者: {r.performedBy.displayName} / {formatJst(r.recordedAt)}
                </p>
                {r.notes && <p className="text-xs text-slate-600">メモ: {r.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
