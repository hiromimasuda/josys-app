import Link from "next/link";
import { prisma } from "@ops/db";
import { FIXED_NOW, formatJst } from "@ops/domain";
import { CaseStatusBadge, DemoBadge, FactStatusBadge, PriorityBadge, RiskBadge } from "@/components/badges";
import { EmptyState, Section } from "@/components/Section";

// §5.2 今日の情シス(Gate 2: DB参照)。全43業務表・完了履歴全件・秘密情報は表示しない。
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const a1Horizon = new Date(FIXED_NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
  const [a0, r3, a1, approvals, next30, staleSources] = await Promise.all([
    prisma.case.findMany({ where: { priority: "A0", status: { not: "COMPLETED" } }, orderBy: { id: "asc" } }),
    prisma.case.findMany({ where: { risk: "R3", status: { not: "COMPLETED" } } }),
    prisma.case.findMany({
      where: { priority: "A1", status: { not: "COMPLETED" }, dueAt: { lte: a1Horizon } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.approval.findMany({
      where: { status: "PENDING" },
      include: { case: { select: { id: true, title: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.scheduleOccurrence.findMany({ orderBy: { dueAt: "asc" }, include: { operation: true } }),
    prisma.sourceAsset.findMany({ where: { status: { in: ["STALE", "CONFLICTING"] } }, orderBy: { id: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">今日の情シス</h1>
        <p className="text-xs text-slate-500">
          DEMO基準時刻: {formatJst(FIXED_NOW.toISOString())} <DemoBadge />
        </p>
      </div>

      <Section title="1. A0未完了・重大アラート" tone="red">
        {a0.length === 0 ? (
          <EmptyState>A0の未完了はありません。</EmptyState>
        ) : (
          <ul className="space-y-2">
            {a0.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="tap flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 p-3 hover:bg-red-50"
                >
                  <span className="font-semibold">{c.title}</span>
                  <PriorityBadge priority={c.priority} />
                  <RiskBadge risk={c.risk} />
                  <CaseStatusBadge status={c.status} />
                  {c.dueAt && <span className="text-xs text-slate-600">期限 {formatJst(c.dueAt.toISOString())}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {r3.length > 0 && (
          <p className="mt-2 rounded-lg border border-red-400 bg-red-100 p-2 text-sm font-bold text-red-900">
            R3(緊急封じ込め)対応中: {r3.map((c) => c.title).join(" / ")} —
            速やかな共有と最小封じ込めのみ。単独で完了させないでください。
          </p>
        )}
      </Section>

      <Section title="2. 本日期限・3日以内のA1" tone="amber">
        {a1.length === 0 ? (
          <EmptyState>期限間近のA1はありません。次の30日を確認できます。</EmptyState>
        ) : (
          <ul className="space-y-2">
            {a1.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="tap flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 p-3 hover:bg-amber-50"
                >
                  <span className="font-semibold">{c.title}</span>
                  <PriorityBadge priority={c.priority} />
                  <RiskBadge risk={c.risk} />
                  {c.dueAt && <span className="text-xs text-slate-600">期限 {formatJst(c.dueAt.toISOString())}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="3. 承認待ち" tone="purple">
        {approvals.length === 0 ? (
          <EmptyState>承認待ちはありません。</EmptyState>
        ) : (
          <ul className="space-y-2">
            {approvals.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/cases/${a.caseId}`}
                  className="tap flex flex-wrap items-center gap-2 rounded-lg border border-purple-200 p-3 hover:bg-purple-50"
                >
                  <span className="font-semibold">{a.case.title}</span>
                  <RiskBadge risk={a.risk} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="4. 失敗した自動化・手動代替中">
        <EmptyState>
          現在、失敗した自動化はありません。AutomationRegistryの監視はGate 3以降で実装予定です。
        </EmptyState>
      </Section>

      <Section title="5. 次の30日" tone="blue">
        <ul className="space-y-2">
          {next30.map((s) => (
            <li key={s.id}>
              <Link
                href={`/operations/${s.operationId}`}
                className="tap flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 p-3 hover:bg-blue-50"
              >
                <span className="font-semibold">{s.title}</span>
                <span className="text-xs text-slate-600">
                  {s.operation.id} {s.operation.name} / 期限 {formatJst(s.dueAt.toISOString())}
                </span>
                {s.status === "OVERDUE" && (
                  <span className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800">
                    期限超過
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="6. 不在時の引継ぎ">
        <p className="text-sm text-slate-700">
          担当者不在時の一次受け・承認の代替は<Link href="/handover" className="text-blue-800 underline">引継ぎ</Link>
          を確認してください。
        </p>
      </Section>

      <Section title="7. ナレッジ要更新">
        {staleSources.length === 0 ? (
          <EmptyState>要更新のナレッジはありません。</EmptyState>
        ) : (
          <ul className="space-y-2">
            {staleSources.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-medium">{s.title}</span>
                <FactStatusBadge status={s.factStatus} />
                <span className="text-xs text-slate-500">{s.status === "STALE" ? "更新期限超過" : "正本競合"}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          一覧は<Link href="/knowledge" className="text-blue-800 underline">ナレッジ</Link>へ。
        </p>
      </Section>

      <Section title="何か起きたら" tone="red">
        <Link
          href="/events"
          className="tap inline-flex items-center rounded-lg bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-800"
        >
          発生時アクションを開く(15入口)
        </Link>
      </Section>
    </div>
  );
}
