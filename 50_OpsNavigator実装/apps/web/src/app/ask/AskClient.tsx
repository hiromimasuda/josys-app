"use client";
import { useState } from "react";
import type { StructuredMockAnswer } from "@ops/ai";
import { AuthorityBadge, GeneralGuidanceBadge, PriorityBadge, RiskBadge } from "@/components/badges";
import { Section } from "@/components/Section";
import { api, describeError } from "@/lib/api";

const presets = [
  "全社のWi-Fiがつながらない",
  "見たことがないSaaSのエラーが出ている",
  "Driveの外部共有を設定したい",
];

// §5.9 AI情シスガイド。サーバー側の決定論mock(AI_ENABLED=false・外部AI未接続)。
export function AskClient() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<StructuredMockAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setError(null);
    try {
      setAnswer(await api<StructuredMockAnswer>("/api/v1/ai/answer", {
        method: "POST",
        body: JSON.stringify({ question: q }),
      }));
    } catch (e) {
      setError(describeError(e));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">AI相談(mock)</h1>
      <p className="rounded-lg border border-slate-300 bg-slate-100 p-3 text-xs text-slate-600">
        これは決定論的なmock回答です。外部AIへは接続していません。回答は実行者でも承認者でもなく、
        高リスク操作は手順案内と承認依頼までに留まります。
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
        className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"
      >
        <label htmlFor="ask-input" className="block text-sm font-semibold">
          起きていること・知りたいこと(秘密情報は入力しない)
        </label>
        <textarea
          id="ask-input"
          className="tap w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="tap rounded-lg bg-blue-800 px-4 py-2 text-sm font-bold text-white hover:bg-blue-900">
            質問する
          </button>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => ask(p)}
              className="tap rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-900 hover:bg-blue-100"
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-lg border border-red-400 bg-red-100 p-3 text-sm font-semibold text-red-900">
          {error}
        </p>
      )}

      {answer && (
        <div className="space-y-3" data-testid="ai-answer">
          <p className="text-xs text-slate-500">
            回答種別: {answer.answerType} / mockシナリオ: {answer.scenarioId}(決定論) / 基準:{" "}
            {answer.updatedAtLabel}
          </p>

          <Section title="1. 緊急度" tone="amber">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={answer.urgency} />
              <RiskBadge risk={answer.risk} />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              行別優先度は正本未同期のため断定しません。影響範囲の確認後に判断してください。
            </p>
          </Section>

          <Section title="2. まずやること" tone="blue">
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {answer.firstActions.map((a) => (
                <li key={a.action}>
                  <span className="font-semibold">{a.action}</span>
                  <span className="block text-xs text-slate-600">理由: {a.reason}</span>
                  {a.safeWithoutApproval && (
                    <span className="text-xs text-green-800">承認なしで実施可能(可逆)</span>
                  )}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="3. やってはいけないこと" tone="red">
            <ul className="list-disc space-y-1 pl-5 text-sm font-medium text-red-900">
              {answer.doNotDo.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Section>

          {answer.conflictSources && answer.conflictSources.length > 0 && (
            <p
              data-testid="conflict-warning"
              className="rounded-lg border border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-900"
            >
              要突合: 正本が競合しています。AIはどちらも確定として扱いません —{" "}
              {answer.conflictSources.map((s) => s.title).join(" / ")}
            </p>
          )}

          <Section title="4. 社内で確定していること">
            {answer.internalPolicy.conclusion ? (
              <>
                <p className="text-sm">{answer.internalPolicy.conclusion}</p>
                <p className="mt-1 text-xs text-slate-600">確度: {answer.internalPolicy.confidence}</p>
              </>
            ) : (
              <p className="text-sm text-slate-600">
                社内正本から確定した回答は見つかりませんでした(確度: {answer.internalPolicy.confidence})。
                一般的な確認手順を表示し、担当へケースを渡せます。
              </p>
            )}
          </Section>

          <Section title="5. 一般的な情シス推奨" tone="amber">
            <p className="mb-2"><GeneralGuidanceBadge /></p>
            <p className="text-sm">{answer.generalGuidance.recommendation}</p>
          </Section>

          <Section title="6. この会社へ適用する際の要確認">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {answer.uncertainties.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </Section>

          <Section title="7. 承認・エスカレーション" tone="purple">
            {answer.escalation.condition ? (
              <p className="text-sm">
                {answer.escalation.condition} → {answer.escalation.destinationRole} へエスカレーション
              </p>
            ) : (
              <p className="text-sm text-slate-600">現時点で必須の承認はありません。</p>
            )}
          </Section>

          <Section title="8. 証跡・戻し方">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {answer.evidenceRequired.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            {answer.rollbackOrFallback && (
              <p className="mt-2 text-sm text-slate-700">戻し方/縮退: {answer.rollbackOrFallback}</p>
            )}
          </Section>

          <Section title="9. 出典・更新日">
            {answer.internalPolicy.sources.length === 0 ? (
              <p className="text-sm text-slate-600">社内出典なし(一般論のみ)。</p>
            ) : (
              <ul className="space-y-2">
                {answer.internalPolicy.sources.map((s) => (
                  <li key={s.sourceId} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{s.title}</span>
                      <AuthorityBadge authority={s.authority} />
                    </span>
                    <span className="block text-xs text-slate-500">
                      <code>{s.uri}</code>(表示のみ・外部取得しません)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
