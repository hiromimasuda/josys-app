import Link from "next/link";
import { FIXED_NOW, formatJst, homeSelectors, operationById } from "@ops/domain";
import { EmptyState, Section } from "@/components/Section";

// §5.8 カレンダー。Gate 1は「今日/次の30日」実行キューのみ。周期・年間はGate 2。
export default function CalendarPage() {
  const occurrences = homeSelectors.next30Days();
  const todayJst = formatJst(FIXED_NOW.toISOString()).slice(0, 10);
  const today = occurrences.filter((s) => formatJst(s.dueAt).slice(0, 10) === todayJst);
  const later = occurrences.filter((s) => formatJst(s.dueAt).slice(0, 10) !== todayJst);

  const renderList = (items: typeof occurrences) => (
    <ul className="space-y-2">
      {items.map((s) => {
        const op = operationById.get(s.operationId);
        return (
          <li key={s.id}>
            <Link
              href={`/operations/${s.operationId}`}
              className="tap flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:bg-blue-50"
            >
              <span className="font-semibold">{s.title}</span>
              <span className="text-xs text-slate-600">
                {op ? `${op.id} ${op.name}` : s.operationId} / 期限 {formatJst(s.dueAt)}
              </span>
              {s.status === "OVERDUE" && (
                <span className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800">
                  期限超過
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">カレンダー(今日 / 次の30日)</h1>
      <p className="text-xs text-slate-500">
        DEMO基準時刻: {formatJst(FIXED_NOW.toISOString())} / 保存はUTC・表示はJST
      </p>

      <Section title="今日" tone="amber">
        {today.length === 0 ? <EmptyState>今日の期限はありません。</EmptyState> : renderList(today)}
      </Section>

      <Section title="次の30日" tone="blue">
        {later.length === 0 ? <EmptyState>予定はありません。</EmptyState> : renderList(later)}
      </Section>

      <Section title="周期 / 年間ビュー">
        <EmptyState>
          周期ルール・年間(法定・契約・監査)ビューはGate 2で実装します。周期ルールと実日付は同じ欄で二重管理しません。
        </EmptyState>
      </Section>
    </div>
  );
}
