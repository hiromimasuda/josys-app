import Link from "next/link";
import { notFound } from "next/navigation";
import { eventById, flowById, operationById, seed } from "@ops/domain";
import {
  FactStatusBadge,
  GeneralGuidanceBadge,
  PriorityBadge,
  RiskBadge,
} from "@/components/badges";
import { Section } from "@/components/Section";
import { GUIDE_LABEL, eventGuides } from "@/data/eventGuides";

export function generateStaticParams() {
  return seed.eventTemplates.map((ev) => ({ eventId: ev.id }));
}

// §5.3 カード押下直後ビュー
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const ev = eventById.get(eventId);
  if (!ev) notFound();
  const guide = eventGuides[ev.id];

  return (
    <div className="space-y-4">
      <nav aria-label="パンくず" className="text-xs text-slate-500">
        <Link href="/events" className="underline">発生時アクション</Link> / {ev.name}
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold">{ev.name}</h1>
        <RiskBadge risk={ev.initialRisk} />
      </div>
      {ev.riskNote && <p className="text-sm text-slate-600">{ev.riskNote}</p>}

      {guide && (
        <>
          <Section title={<span className="flex flex-wrap items-center gap-2">まずすること <GeneralGuidanceBadge /></span>} tone="blue">
            <p className="mb-2 text-xs text-slate-500">{GUIDE_LABEL}</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {guide.firstActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </Section>

          <Section title="やってはいけないこと" tone="red">
            <ul className="list-disc space-y-1 pl-5 text-sm font-medium text-red-900">
              {guide.doNotDo.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Section>

          <Section title="影響範囲の確認質問">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {guide.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </Section>
        </>
      )}

      <Section title="暫定優先度とリスク区分">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={null} />
          <RiskBadge risk={ev.initialRisk} />
        </div>
        <p className="mt-2 text-xs text-slate-600">
          行別の日常優先度(A0〜D)は正本Sheet未同期のため要確認です。推測で確定しません(DEMOケースのみA0/A1表示を例示)。
        </p>
      </Section>

      <Section title={<span className="flex flex-wrap items-center gap-2">関連業務 <FactStatusBadge status={ev.mappingFactStatus} /></span>}>
        <p className="mb-2 text-xs text-slate-600">
          この対応付けは提案(PROPOSED)です。正本との突合はGate 3前に行います。
        </p>
        <ul className="space-y-2" data-testid="related-operations">
          {ev.operationIds.map((opId) => {
            const op = operationById.get(opId);
            if (!op) return null;
            const flow = flowById.get(op.flowId);
            return (
              <li key={opId}>
                <Link
                  href={`/operations/${opId}`}
                  className="tap flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3 hover:bg-blue-50"
                >
                  <span className="font-semibold">
                    {op.id} {op.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {flow ? `${flow.id} ${flow.name}` : op.flowId}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="実行担当・判断者・不在時受け" tone="amber">
        <p className="text-sm">
          <FactStatusBadge status="NEEDS_CONFIRMATION" />{" "}
          担当・判断者の本番割当は未決事項(D-01/D-03)のため表示しません。DEMOでは
          「初任オペレーター(実行)・承認者(判断)」のロール名のみを使用します。
        </p>
      </Section>

      <Section title="手順・戻し方・最低運用">
        <p className="text-sm text-slate-600">
          <FactStatusBadge status="NEEDS_CONFIRMATION" />{" "}
          社内Runbook本文は未同期です(SourceRegistry同期はGate 2以降)。上の一般的な初動ガイドと
          関連業務の詳細を参照してください。
        </p>
      </Section>

      <Section title="必須証跡(一般例)">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>対応前の状態記録(スクリーンショット・設定値)</li>
          <li>実施した操作と時刻の記録</li>
          <li>{ev.initialRisk === "R2" || ev.initialRisk === "R3" ? "実行前の承認記録(R2/R3は必須)" : "必要に応じた承認記録"}</li>
          <li>対応後の確認結果と本人確認</li>
        </ul>
      </Section>

      <div>
        <Link
          href={`/cases/new?event=${ev.id}`}
          className="tap inline-flex items-center rounded-lg bg-blue-800 px-4 py-2 font-bold text-white hover:bg-blue-900"
        >
          このevent でケースを作成
        </Link>
      </div>
    </div>
  );
}
