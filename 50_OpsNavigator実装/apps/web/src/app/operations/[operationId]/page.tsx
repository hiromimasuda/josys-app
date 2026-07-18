import Link from "next/link";
import { notFound } from "next/navigation";
import {
  casesForOperation,
  eventsForOperation,
  flowById,
  formatJst,
  operationById,
  seed,
} from "@ops/domain";
import { CaseStatusBadge, FactStatusBadge, PriorityBadge, RiskBadge } from "@/components/badges";
import { EmptyState, Section } from "@/components/Section";

export function generateStaticParams() {
  return seed.operations.map((op) => ({ operationId: op.id }));
}

// §5.7 業務詳細。未同期セクションは推測せず「要確認」を明示する。
export default async function OperationDetailPage({
  params,
}: {
  params: Promise<{ operationId: string }>;
}) {
  const { operationId } = await params;
  const op = operationById.get(operationId);
  if (!op) notFound();
  const flow = flowById.get(op.flowId);
  const events = eventsForOperation(op.id);
  const cases = casesForOperation(op.id);
  const occurrences = seed.scheduleOccurrences.filter((s) => s.operationId === op.id);

  const pendingSection = (
    <p className="text-sm text-slate-600">
      <FactStatusBadge status="NEEDS_CONFIRMATION" /> 正本(Docs/Sheets)未同期のため未表示。SourceRegistry同期(Gate 2以降)で反映します。
    </p>
  );

  return (
    <div className="space-y-4">
      <nav aria-label="パンくず" className="text-xs text-slate-500">
        <Link href="/operations" className="underline">業務43</Link> / {op.id}
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold">
          {op.id} {op.name}
        </h1>
        <PriorityBadge priority={op.operationalPriority} />
        <FactStatusBadge status={op.factStatus} />
      </div>
      <p className="text-sm text-slate-600">
        フロー: {flow ? `${flow.id} ${flow.name}` : op.flowId}
      </p>

      <Section title="この業務は何か / なぜ必要か">{pendingSection}</Section>

      <Section title="いつ発生するか">
        {occurrences.length === 0 ? (
          pendingSection
        ) : (
          <ul className="space-y-1 text-sm">
            {occurrences.map((s) => (
              <li key={s.id}>
                {s.title} — 期限 {formatJst(s.dueAt)}
                {s.status === "OVERDUE" && (
                  <span className="ml-2 rounded border border-red-300 bg-red-50 px-1.5 text-xs font-bold text-red-800">期限超過</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="発生入口(この業務に到達するevent)">
        {events.length === 0 ? (
          <EmptyState>対応付けられた入口はありません(mappingはPROPOSED)。</EmptyState>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/events/${ev.id}`}
                  className="tap flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3 hover:bg-blue-50"
                >
                  <span className="font-semibold">{ev.name}</span>
                  <RiskBadge risk={ev.initialRisk} />
                  <FactStatusBadge status={ev.mappingFactStatus} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="最初の行動 / 標準手順 / 判断基準 / 例外・戻し方">{pendingSection}</Section>

      <Section title="関係者・権限・承認">
        <p className="text-sm">
          <FactStatusBadge status="NEEDS_CONFIRMATION" /> 担当・判断者・受領者の本番割当は未決(D-01/D-03)。
          高リスク操作(R2/R3)は実行前承認・前後証跡・戻し方が必須です。
        </p>
      </Section>

      <Section title="関連ケース(DEMO)">
        {cases.length === 0 ? (
          <EmptyState>関連するDEMOケースはありません。</EmptyState>
        ) : (
          <ul className="space-y-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="tap flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3 hover:bg-blue-50"
                >
                  <span className="font-semibold">{c.title}</span>
                  <CaseStatusBadge status={c.status} />
                  <RiskBadge risk={c.risk} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="完了条件・証跡 / 正本・参照資料 / 最終確認日 / 後任裁量 / 将来構想">
        {pendingSection}
      </Section>
    </div>
  );
}
