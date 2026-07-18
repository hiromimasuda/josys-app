import Link from "next/link";
import { notFound } from "next/navigation";
import {
  approvalsByCase,
  eventById,
  evidenceByCase,
  exceptionsByCase,
  formatJst,
  operationById,
  seed,
  sourceById,
  userById,
} from "@ops/domain";
import {
  AuthorityBadge,
  CaseStatusBadge,
  FactStatusBadge,
  GeneralGuidanceBadge,
  PriorityBadge,
  RiskBadge,
} from "@/components/badges";
import { EmptyState, Section } from "@/components/Section";
import { GUIDE_LABEL, eventGuides } from "@/data/eventGuides";

export function generateStaticParams() {
  return seed.demoCases.map((c) => ({ caseId: c.id }));
}

// §5.5 ケース詳細: 上部固定情報 + 7タブ相当のセクション
export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const demoCase = seed.demoCases.find((c) => c.id === caseId);
  if (!demoCase) notFound();

  const ev = eventById.get(demoCase.eventTemplateId);
  const guide = ev ? eventGuides[ev.id] : undefined;
  const assignee = userById.get(demoCase.assigneeUserId);
  const approvals = approvalsByCase(demoCase.id);
  const evidence = evidenceByCase(demoCase.id);
  const exceptions = exceptionsByCase(demoCase.id);
  const highRisk = demoCase.risk === "R2" || demoCase.risk === "R3";
  const isConflictCase = demoCase.factStatus === "CONFLICTING";
  const conflictSources = seed.sourceAssets.filter((s) => s.status === "CONFLICTING");

  const tabs = [
    ["now", "今やる"],
    ["why", "なぜ"],
    ["steps", "手順"],
    ["evidence", "証跡"],
    ["sources", "根拠"],
    ["history", "履歴"],
    ["improve", "改善"],
  ] as const;

  return (
    <div className="space-y-4">
      <nav aria-label="パンくず" className="text-xs text-slate-500">
        <Link href="/cases" className="underline">ケース</Link> / {demoCase.id}
      </nav>

      {/* 上部固定 */}
      <div className="sticky top-12 z-30 rounded-xl border border-slate-300 bg-white p-4 shadow">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold">{demoCase.title}</h1>
          <PriorityBadge priority={demoCase.operationalPriority} />
          <RiskBadge risk={demoCase.risk} />
          <CaseStatusBadge status={demoCase.status} />
        </div>
        <p className="mt-1 text-xs text-slate-600">
          担当: {assignee?.displayName ?? "-"} / 期限: {formatJst(demoCase.dueAt)} / 入口:{" "}
          {ev?.name ?? demoCase.eventTemplateId}
        </p>
        <nav aria-label="ケース内タブ" className="mt-2 flex flex-wrap gap-1">
          {tabs.map(([id, label]) => (
            <a
              key={id}
              href={`#tab-${id}`}
              className="tap rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-blue-50"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {highRisk && (
        <p className="rounded-lg border border-purple-400 bg-purple-50 p-3 text-sm font-semibold text-purple-900">
          {demoCase.risk === "R3"
            ? "R3: 速やかな共有と安全上やむを得ない最小封じ込めのみ。承認・証跡・事後確認なしで完了できません。"
            : "R2: 実行前承認・前後証跡・戻し方が必須です。承認なしで完了できません。"}
          (サーバー側の完了ガードはGate 2で実装)
        </p>
      )}

      {isConflictCase && (
        <p className="rounded-lg border border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-900">
          要突合: このケースの根拠となる正本が競合しています。どちらか一方を確定として扱わないでください。
        </p>
      )}

      <Section id="tab-now" title="今やる(チェックリスト)" tone="blue">
        {guide ? (
          <>
            <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {GUIDE_LABEL} <GeneralGuidanceBadge />
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {guide.firstActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
            <p className="mt-3 text-sm font-semibold text-red-900">やってはいけないこと</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-red-900">
              {guide.doNotDo.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </>
        ) : (
          <EmptyState>入口ガイドがありません。</EmptyState>
        )}
      </Section>

      <Section id="tab-why" title="なぜ(判断理由・影響)">
        <p className="text-sm text-slate-700">
          リスク区分 {demoCase.risk} の理由: {ev?.riskNote ?? "-"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          社内正本の判断理由本文は未同期です(Gate 2以降)。
        </p>
      </Section>

      <Section id="tab-steps" title="手順(Runbook・分岐・戻し方)">
        <p className="text-sm text-slate-600">
          <FactStatusBadge status="NEEDS_CONFIRMATION" /> Runbook本文は未同期。関連業務:
        </p>
        <ul className="mt-2 space-y-1">
          {demoCase.operationIds.map((opId) => {
            const op = operationById.get(opId);
            return (
              <li key={opId}>
                <Link href={`/operations/${opId}`} className="tap inline-flex items-center gap-1 text-sm text-blue-800 underline">
                  {op ? `${op.id} ${op.name}` : opId}
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="tab-evidence" title="証跡" tone="purple">
        {evidence.length === 0 ? (
          <EmptyState>
            証跡はまだ登録されていません。{highRisk && "R2/R3は実行前・実行後・本人確認の証跡が必須です。"}
          </EmptyState>
        ) : (
          <ul className="space-y-2 text-sm">
            {evidence.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-200 p-2">
                <span className="font-medium">{e.kind}</span> — {formatJst(e.capturedAt)}
                <div className="text-xs text-slate-500">
                  リンク(表示のみ・外部取得しません): <code>{e.uri}</code>
                </div>
              </li>
            ))}
          </ul>
        )}
        {approvals.length > 0 && (
          <>
            <p className="mt-3 text-sm font-semibold">承認</p>
            <ul className="space-y-1 text-sm">
              {approvals.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2">
                  <RiskBadge risk={a.risk} />
                  <span>状態: {a.status === "PENDING" ? "承認待ち" : a.status}</span>
                  <span className="text-xs text-slate-500">
                    依頼先: {userById.get(a.requestedFromUserId)?.displayName ?? "-"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section id="tab-sources" title="根拠(社内正本)">
        {isConflictCase && conflictSources.length > 0 ? (
          <ul className="space-y-2">
            {conflictSources.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50/40 p-3 text-sm">
                <span className="font-medium">{s.title}</span>
                <AuthorityBadge authority={s.authority} />
                <FactStatusBadge status="CONFLICTING" />
                <span className="w-full text-xs text-slate-500">
                  <code>{s.uri}</code>(表示のみ)
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">
            {(() => {
              const runbook = sourceById.get("SRC-DEMO-RUNBOOK");
              return demoCase.eventTemplateId === "EV-04" && runbook
                ? `${runbook.title}(正本Runbook・AI利用可)を参照できます。`
                : "対応付けられた正本はまだ登録されていません(SourceRegistryはGate 2)。";
            })()}
          </p>
        )}
      </Section>

      <Section id="tab-history" title="履歴">
        <EmptyState>状態・担当・期限・承認の変更履歴(AuditEvent)はGate 2で実装します。</EmptyState>
      </Section>

      <Section id="tab-improve" title="改善(FAQ候補・再発防止)">
        <EmptyState>FAQ候補・Runbook差分の起票(KnowledgeCandidate)はGate 2で実装します。</EmptyState>
      </Section>

      {exceptions.length > 0 && (
        <Section title="例外(期限付き代替統制)" tone="amber">
          <ul className="space-y-2 text-sm">
            {exceptions.map((x) => (
              <li key={x.id} className="rounded-lg border border-amber-200 p-3">
                <p className="font-medium">{x.reason}</p>
                <p className="text-xs text-slate-600">
                  担当: {userById.get(x.ownerUserId)?.displayName ?? "-"} / 期限: {formatJst(x.dueAt)} /
                  次回確認: {formatJst(x.nextReviewAt)}
                </p>
                <p className="text-xs text-slate-600">代替策: {x.fallback}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
