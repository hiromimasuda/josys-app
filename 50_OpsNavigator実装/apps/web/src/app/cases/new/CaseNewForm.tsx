"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { detectForbiddenInput, seed } from "@ops/domain";
import { api, describeError } from "@/lib/api";

const scopes = [
  ["SINGLE_USER", "本人のみ"],
  ["TEAM", "チーム"],
  ["MULTI_TEAM", "複数チーム"],
  ["COMPANY", "全社"],
  ["EXTERNAL", "社外を含む"],
] as const;

export function CaseNewForm({ initialEventId }: { initialEventId: string }) {
  const router = useRouter();
  const [eventId, setEventId] = useState(initialEventId);
  const [occurredAt, setOccurredAt] = useState("2026-07-17T16:00");
  const [impactTarget, setImpactTarget] = useState("");
  const [impactScope, setImpactScope] = useState<(typeof scopes)[number][0]>("SINGLE_USER");
  const [ongoing, setOngoing] = useState("yes");
  const [recentChange, setRecentChange] = useState("no");
  const [securitySignal, setSecuritySignal] = useState("no");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!eventId) {
      setError("発生種別を選択してください。");
      return;
    }
    if (!impactTarget.trim()) {
      setError("影響対象を入力してください。");
      return;
    }
    const forbidden = detectForbiddenInput(`${impactTarget} ${summary}`);
    if (forbidden) {
      setError(
        `${forbidden}が含まれている可能性があります。パスワード・APIキー・Token・Cookie・秘密鍵・個人情報の全文・ログ全文は入力できません。該当箇所を削除してください。`,
      );
      return;
    }
    try {
      // サーバー側でも禁止入力・RBAC・妥当性を再検証する(クライアント検知は補助)
      const created = await api<{ id: string }>("/api/v1/cases", {
        method: "POST",
        body: JSON.stringify({
          eventTemplateId: eventId,
          occurredAt: new Date(`${occurredAt}:00+09:00`).toISOString(),
          impactTarget: impactTarget.trim(),
          impactScope,
          ongoing: ongoing === "yes",
          recentChange: recentChange === "yes",
          securitySignal: securitySignal === "yes",
          summary: summary.trim(),
        }),
      });
      router.push(`/cases/${created.id}`);
    } catch (err) {
      setError(describeError(err));
    }
  };

  const fieldClass = "tap w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold">ケース受付・トリアージ</h1>

      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
        <p className="font-bold">入力してはいけないもの</p>
        <p>
          パスワード / APIキー・Token / Cookie / 秘密鍵 / 個人情報の全文 /
          メール・ログの全文貼り付け。エラー内容は必要最小限の抜粋だけにしてください。
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm font-semibold text-red-900">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label htmlFor="event" className="mb-1 block text-sm font-semibold">
            発生種別 <span className="text-red-700">*</span>
          </label>
          <select id="event" className={fieldClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">選択してください</option>
            {seed.eventTemplates.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="occurredAt" className="mb-1 block text-sm font-semibold">
            発生時刻(JST) <span className="text-red-700">*</span>
          </label>
          <input
            id="occurredAt"
            type="datetime-local"
            className={fieldClass}
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="impactTarget" className="mb-1 block text-sm font-semibold">
            影響対象(人数・部署・システム名など) <span className="text-red-700">*</span>
          </label>
          <input
            id="impactTarget"
            type="text"
            className={fieldClass}
            value={impactTarget}
            onChange={(e) => setImpactTarget(e.target.value)}
            placeholder="例: 営業チームの共有PC 1台"
            required
          />
        </div>

        <div>
          <label htmlFor="impactScope" className="mb-1 block text-sm font-semibold">
            影響範囲 <span className="text-red-700">*</span>
          </label>
          <select
            id="impactScope"
            className={fieldClass}
            value={impactScope}
            onChange={(e) => setImpactScope(e.target.value as (typeof scopes)[number][0])}
          >
            {scopes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">現在も継続中か <span className="text-red-700">*</span></legend>
          <div className="flex gap-4 text-sm">
            <label className="tap flex items-center gap-1"><input type="radio" name="ongoing" value="yes" checked={ongoing === "yes"} onChange={() => setOngoing("yes")} /> 継続中</label>
            <label className="tap flex items-center gap-1"><input type="radio" name="ongoing" value="no" checked={ongoing === "no"} onChange={() => setOngoing("no")} /> 収束した</label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">直前の変更有無 <span className="text-red-700">*</span></legend>
          <div className="flex gap-4 text-sm">
            <label className="tap flex items-center gap-1"><input type="radio" name="recentChange" value="yes" checked={recentChange === "yes"} onChange={() => setRecentChange("yes")} /> あり</label>
            <label className="tap flex items-center gap-1"><input type="radio" name="recentChange" value="no" checked={recentChange === "no"} onChange={() => setRecentChange("no")} /> なし/不明</label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-sm font-semibold">セキュリティ兆候有無 <span className="text-red-700">*</span></legend>
          <div className="flex gap-4 text-sm">
            <label className="tap flex items-center gap-1"><input type="radio" name="securitySignal" value="yes" checked={securitySignal === "yes"} onChange={() => setSecuritySignal("yes")} /> あり(不審な挙動・通知)</label>
            <label className="tap flex items-center gap-1"><input type="radio" name="securitySignal" value="no" checked={securitySignal === "no"} onChange={() => setSecuritySignal("no")} /> なし</label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="summary" className="mb-1 block text-sm font-semibold">
            概要(任意・秘密情報を含めない)
          </label>
          <textarea
            id="summary"
            className={fieldClass}
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="必要最小限の抜粋のみ"
          />
        </div>

        <button
          type="submit"
          className="tap w-full rounded-lg bg-blue-800 px-4 py-2 font-bold text-white hover:bg-blue-900"
        >
          ケースを作成(DEMO DBへ保存)
        </button>
        <p className="text-xs text-slate-500">
          ローカルDEMO DB(127.0.0.1)にのみ保存されます。外部送信はありません。
        </p>
      </form>
    </div>
  );
}
