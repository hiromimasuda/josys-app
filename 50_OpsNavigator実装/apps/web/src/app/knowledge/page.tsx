import { seed } from "@ops/domain";
import { AuthorityBadge, FactStatusBadge } from "@/components/badges";
import { EmptyState, Section } from "@/components/Section";

// §5.10 ナレッジ(Gate 1: SourceRegistryの閲覧のみ。検索・同期はGate 2)
export default function KnowledgePage() {
  const conflicting = seed.sourceAssets.filter((s) => s.status === "CONFLICTING");
  const stale = seed.sourceAssets.filter((s) => s.status === "STALE");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ナレッジ(SourceRegistry)</h1>

      {conflicting.length > 0 && (
        <p className="rounded-lg border border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-900">
          要突合: 競合する正本が{conflicting.length}件あります。解消まで一方を確定として使用しないでください。
        </p>
      )}

      <Section title="登録済み情報源">
        <ul className="space-y-2">
          {seed.sourceAssets.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{s.title}</span>
                <AuthorityBadge authority={s.authority} />
                <FactStatusBadge status={s.factStatus} />
              </p>
              <p className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>機密: {s.confidentiality}</span>
                <span>状態: {s.status}</span>
                <span className={s.approvedForAi ? "text-green-800" : "text-slate-500"}>
                  AI利用: {s.approvedForAi ? "承認済み" : "未承認(回答根拠に使用しない)"}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                <code>{s.uri}</code>(表示のみ・外部取得しません)
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="更新期限超過(stale)" tone="amber">
        {stale.length === 0 ? (
          <EmptyState>期限超過の資料はありません。</EmptyState>
        ) : (
          <p className="text-sm">
            {stale.map((s) => s.title).join(" / ")} — 現行手順として断定せず、確認後に利用してください。
          </p>
        )}
      </Section>

      <Section title="検索・FAQ候補・同期">
        <EmptyState>
          全文検索、FAQ候補レビュー、SourceRegistry同期状態はGate 2で実装します。この資料が未承認のためAI回答に使っていない場合は、その旨を回答画面に表示します。
        </EmptyState>
      </Section>
    </div>
  );
}
