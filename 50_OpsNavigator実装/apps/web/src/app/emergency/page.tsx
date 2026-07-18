import Link from "next/link";
import { FIXED_NOW, formatJst, seed } from "@ops/domain";
import { GeneralGuidanceBadge, RiskBadge } from "@/components/badges";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Section } from "@/components/Section";
import { GUIDE_LABEL, eventGuides } from "@/data/eventGuides";

// §13 PWA Emergency Pack。オフラインでも開けるよう最小情報のみを持つ。
// 個人情報・秘密情報・原ログ・契約本文・個人連絡先はキャッシュしない。
const representative = ["EV-04", "EV-05", "EV-06", "EV-11"];

export default function EmergencyPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold text-red-900">緊急パック(Emergency Pack)</h1>
      </div>
      <OfflineBanner />
      <p className="text-xs text-slate-500">
        データ基準時刻: {formatJst(FIXED_NOW.toISOString())} /
        このページはオフライン閲覧用に端末へ保存されます。外部への書き込みは行いません。
      </p>

      <Section title="代表4事象の初動" tone="red">
        <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {GUIDE_LABEL} <GeneralGuidanceBadge />
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {representative.map((id) => {
            const ev = seed.eventTemplates.find((e) => e.id === id);
            const guide = eventGuides[id];
            if (!ev || !guide) return null;
            return (
              <li key={id} className="rounded-lg border border-red-200 bg-red-50/40 p-3">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {ev.name} <RiskBadge risk={ev.initialRisk} />
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700">まずすること</p>
                <ol className="list-decimal pl-5 text-sm">
                  {guide.firstActions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
                <p className="mt-1 text-xs font-semibold text-red-900">やってはいけないこと</p>
                <ul className="list-disc pl-5 text-sm text-red-900">
                  {guide.doNotDo.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="15の発生入口(オフライン一覧)">
        <ul className="grid gap-2 sm:grid-cols-2">
          {seed.eventTemplates.map((ev) => {
            const guide = eventGuides[ev.id];
            return (
              <li key={ev.id} className="rounded-lg border border-slate-200 p-3">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  {ev.name} <RiskBadge risk={ev.initialRisk} />
                </p>
                {guide && guide.firstActions[0] && (
                  <p className="mt-1 text-xs text-slate-600">初動: {guide.firstActions[0]}</p>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="連絡先(役割名のみ)" tone="purple">
        <ul className="list-disc pl-5 text-sm">
          <li>高リスク判断・不在時一次受け: 承認者(approver)</li>
          <li>システム管理・設定: 管理者(admin)</li>
          <li>監査・証跡確認: 監査レビュー者(auditor)</li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          個人名・個人連絡先は保存しません。実際の連絡先は未決事項(D-13)確定後に別掲します。
        </p>
      </Section>

      <p className="text-xs text-slate-500">
        オンライン時は<Link href="/events" className="text-blue-800 underline">発生時アクション</Link>から詳細へ進んでください。
      </p>
    </div>
  );
}
