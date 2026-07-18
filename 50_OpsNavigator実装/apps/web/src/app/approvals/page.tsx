import Link from "next/link";
import { formatJst, seed, userById } from "@ops/domain";
import { RiskBadge } from "@/components/badges";
import { EmptyState, Section } from "@/components/Section";

export default function ApprovalsPage() {
  const pending = seed.approvals.filter((a) => a.status === "PENDING");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">承認・例外</h1>

      <Section title="承認待ち" tone="purple">
        {pending.length === 0 ? (
          <EmptyState>承認待ちはありません。</EmptyState>
        ) : (
          <ul className="space-y-2">
            {pending.map((a) => {
              const c = seed.demoCases.find((dc) => dc.id === a.caseId);
              return (
                <li key={a.id}>
                  <Link
                    href={`/cases/${a.caseId}`}
                    className="tap flex flex-wrap items-center gap-2 rounded-lg border border-purple-200 bg-white p-3 hover:bg-purple-50"
                  >
                    <span className="font-semibold">{c?.title ?? a.caseId}</span>
                    <RiskBadge risk={a.risk} />
                    <span className="text-xs text-slate-600">
                      依頼先: {userById.get(a.requestedFromUserId)?.displayName ?? "-"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          承認・却下の操作とサーバー側のR2/R3完了ガードはGate 2で実装します(Gate 1は閲覧のみ)。
        </p>
      </Section>

      <Section title="例外(期限付き代替統制)" tone="amber">
        <ul className="space-y-2">
          {seed.exceptions.map((x) => (
            <li key={x.id} className="rounded-lg border border-amber-200 bg-white p-3 text-sm">
              <p className="font-medium">{x.reason}</p>
              <p className="mt-1 text-xs text-slate-600">
                担当: {userById.get(x.ownerUserId)?.displayName ?? "-"} / 期限: {formatJst(x.dueAt)} /
                次回確認: {formatJst(x.nextReviewAt)} / 状態: {x.status}
              </p>
              <p className="text-xs text-slate-600">代替策: {x.fallback}</p>
              <Link href={`/cases/${x.caseId}`} className="mt-1 inline-block text-xs text-blue-800 underline">
                関連ケースを開く
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
